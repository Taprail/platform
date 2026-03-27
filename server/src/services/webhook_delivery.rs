use chrono::{Duration, Utc};
use hmac::{Hmac, Mac};
use reqwest::Client;
use sha2::Sha256;
use sqlx::PgPool;
use uuid::Uuid;

type HmacSha256 = Hmac<Sha256>;

pub struct WebhookDeliveryService {
    client: Client,
}

impl WebhookDeliveryService {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(10))
                .build()
                .unwrap_or_else(|_| Client::new()),
        }
    }

    fn sign_payload(payload: &str, secret: &str) -> String {
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
            .expect("HMAC can take key of any size");
        mac.update(payload.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    pub async fn dispatch(
        &self,
        pool: &PgPool,
        business_id: Uuid,
        event_type: &str,
        payload: serde_json::Value,
    ) {
        // Find matching webhook endpoints
        let endpoints: Vec<(Uuid, String, String)> = sqlx::query_as(
            "SELECT we.id, we.url, b.webhook_secret \
             FROM webhook_endpoints we \
             JOIN businesses b ON b.id = we.business_id \
             WHERE we.business_id = $1 AND we.is_active = TRUE AND $2 = ANY(we.events)"
        )
        .bind(business_id)
        .bind(event_type)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        for (endpoint_id, url, secret) in endpoints {
            let event_payload = serde_json::json!({
                "id": format!("evt_{}", Uuid::new_v4()),
                "type": event_type,
                "created_at": Utc::now().to_rfc3339(),
                "data": payload,
            });

            let payload_str = serde_json::to_string(&event_payload).unwrap_or_default();
            let signature = Self::sign_payload(&payload_str, &secret);

            // Create delivery record
            let delivery_id = Uuid::new_v4();
            let _ = sqlx::query(
                "INSERT INTO webhook_deliveries (id, endpoint_id, business_id, event_type, payload, next_retry_at) \
                 VALUES ($1, $2, $3, $4, $5, NOW())"
            )
            .bind(delivery_id)
            .bind(endpoint_id)
            .bind(business_id)
            .bind(event_type)
            .bind(&event_payload)
            .execute(pool)
            .await;

            // Attempt delivery
            let result = self
                .client
                .post(&url)
                .header("Content-Type", "application/json")
                .header("X-Symble-Signature", &signature)
                .header("X-Symble-Event", event_type)
                .body(payload_str)
                .send()
                .await;

            match result {
                Ok(resp) => {
                    let status_code = resp.status().as_u16() as i32;
                    let is_success = resp.status().is_success();
                    let body = resp.text().await.unwrap_or_default();
                    let body_truncated = if body.len() > 4096 { &body[..4096] } else { &body };
                    if is_success {
                        let _ = sqlx::query(
                            "UPDATE webhook_deliveries SET status = 'delivered', attempts = 1, \
                             last_response_code = $1, last_response_body = $2, delivered_at = NOW() WHERE id = $3"
                        )
                        .bind(status_code)
                        .bind(body_truncated)
                        .bind(delivery_id)
                        .execute(pool)
                        .await;
                    } else {
                        let next_retry = Utc::now() + Duration::seconds(30);
                        let _ = sqlx::query(
                            "UPDATE webhook_deliveries SET attempts = 1, last_response_code = $1, \
                             last_response_body = $2, next_retry_at = $3 WHERE id = $4"
                        )
                        .bind(status_code)
                        .bind(body_truncated)
                        .bind(next_retry)
                        .bind(delivery_id)
                        .execute(pool)
                        .await;
                    }
                }
                Err(e) => {
                    let next_retry = Utc::now() + Duration::seconds(30);
                    let err_msg = e.to_string();
                    let _ = sqlx::query(
                        "UPDATE webhook_deliveries SET attempts = 1, last_response_body = $1, next_retry_at = $2 WHERE id = $3"
                    )
                    .bind(&err_msg)
                    .bind(next_retry)
                    .bind(delivery_id)
                    .execute(pool)
                    .await;
                }
            }
        }
    }

    pub async fn retry_pending(pool: &PgPool) {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .unwrap_or_else(|_| Client::new());

        let deliveries: Vec<(Uuid, Uuid, Uuid, serde_json::Value, String, i32)> = sqlx::query_as(
            "SELECT wd.id, wd.endpoint_id, wd.business_id, wd.payload, wd.event_type, wd.attempts \
             FROM webhook_deliveries wd \
             WHERE wd.status = 'pending' AND wd.next_retry_at <= NOW() AND wd.attempts < wd.max_attempts \
             LIMIT 50"
        )
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        for (delivery_id, endpoint_id, _business_id, payload, event_type, attempts) in deliveries {
            let endpoint: Option<(String, String)> = sqlx::query_as(
                "SELECT we.url, b.webhook_secret \
                 FROM webhook_endpoints we \
                 JOIN businesses b ON b.id = we.business_id \
                 WHERE we.id = $1"
            )
            .bind(endpoint_id)
            .fetch_optional(pool)
            .await
            .unwrap_or(None);

            let Some((url, secret)) = endpoint else { continue };

            let payload_str = serde_json::to_string(&payload).unwrap_or_default();
            let signature = Self::sign_payload(&payload_str, &secret);

            let result = client
                .post(&url)
                .header("Content-Type", "application/json")
                .header("X-Symble-Signature", &signature)
                .header("X-Symble-Event", &event_type)
                .body(payload_str)
                .send()
                .await;

            let new_attempts = attempts + 1;
            // Exponential backoff: 30s, 2m, 15m, 1h, 6h
            let backoff_secs = match new_attempts {
                1 => 30,
                2 => 120,
                3 => 900,
                4 => 3600,
                _ => 21600,
            };

            match result {
                Ok(resp) => {
                    let code = resp.status().as_u16() as i32;
                    let is_ok = resp.status().is_success();
                    let body = resp.text().await.unwrap_or_default();
                    let body_truncated = if body.len() > 4096 { &body[..4096] } else { &body };
                    if is_ok {
                        let _ = sqlx::query(
                            "UPDATE webhook_deliveries SET status = 'delivered', attempts = $1, \
                             last_response_code = $2, last_response_body = $3, delivered_at = NOW() WHERE id = $4"
                        )
                        .bind(new_attempts)
                        .bind(code)
                        .bind(body_truncated)
                        .bind(delivery_id)
                        .execute(pool)
                        .await;
                    } else {
                        let status = if new_attempts >= 5 { "failed" } else { "pending" };
                        let next_retry = Utc::now() + Duration::seconds(backoff_secs);
                        let _ = sqlx::query(
                            "UPDATE webhook_deliveries SET status = $1, attempts = $2, \
                             last_response_code = $3, last_response_body = $4, next_retry_at = $5 WHERE id = $6"
                        )
                        .bind(status)
                        .bind(new_attempts)
                        .bind(code)
                        .bind(body_truncated)
                        .bind(next_retry)
                        .bind(delivery_id)
                        .execute(pool)
                        .await;
                    }
                }
                Err(e) => {
                    let status = if new_attempts >= 5 { "failed" } else { "pending" };
                    let next_retry = Utc::now() + Duration::seconds(backoff_secs);
                    let _ = sqlx::query(
                        "UPDATE webhook_deliveries SET status = $1, attempts = $2, \
                         last_response_body = $3, next_retry_at = $4 WHERE id = $5"
                    )
                    .bind(status)
                    .bind(new_attempts)
                    .bind(&e.to_string())
                    .bind(next_retry)
                    .bind(delivery_id)
                    .execute(pool)
                    .await;
                }
            }
        }
    }
}
