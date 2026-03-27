use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{
    ApiResponse, CreateWebhookRequest, PaginationParams,
    WebhookDeliveryResponse, WebhookEndpointResponse,
};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

const VALID_EVENTS: &[&str] = &[
    "session.created",
    "session.verified",
    "session.paid",
    "session.expired",
    "session.cancelled",
    "charge.succeeded",
    "charge.failed",
    "refund.created",
    "refund.completed",
    "dispute.created",
    "dispute.updated",
    "dispute.closed",
    "settlement.completed",
];

pub async fn create_endpoint(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<CreateWebhookRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    if claims.role == "viewer" {
        return Err(ApiError::Forbidden("Viewers cannot manage webhooks".into()));
    }

    // Validate URL
    if !body.url.starts_with("https://") && !body.url.starts_with("http://localhost") {
        return Err(ApiError::BadRequest("Webhook URL must use HTTPS".into()));
    }
    if body.url.len() > 2048 {
        return Err(ApiError::BadRequest("URL too long".into()));
    }

    // Validate events
    if body.events.is_empty() {
        return Err(ApiError::BadRequest("At least one event is required".into()));
    }
    for event in &body.events {
        if !VALID_EVENTS.contains(&event.as_str()) {
            return Err(ApiError::BadRequest(format!("Invalid event: {}", event)));
        }
    }

    let endpoint_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO webhook_endpoints (id, business_id, url, events) VALUES ($1, $2, $3, $4)"
    )
    .bind(endpoint_id)
    .bind(business_id)
    .bind(&body.url)
    .bind(&body.events)
    .execute(pool.get_ref())
    .await?;

    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, None, Some(&claims.email),
        "create", "webhook_endpoint", Some(&endpoint_id.to_string()),
        Some(serde_json::json!({"url": &body.url, "events": &body.events})),
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        WebhookEndpointResponse {
            id: endpoint_id,
            url: body.url.clone(),
            events: body.events.clone(),
            is_active: true,
            created_at: chrono::Utc::now(),
        },
        "Webhook endpoint created",
    )))
}

pub async fn list_endpoints(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let endpoints: Vec<crate::db::WebhookEndpoint> = sqlx::query_as(
        "SELECT * FROM webhook_endpoints WHERE business_id = $1 ORDER BY created_at DESC"
    )
    .bind(business_id)
    .fetch_all(pool.get_ref())
    .await?;

    let endpoints: Vec<WebhookEndpointResponse> = endpoints.into_iter().map(Into::into).collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(endpoints, "Webhook endpoints retrieved")))
}

pub async fn delete_endpoint(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let endpoint_id = path.into_inner();

    if claims.role == "viewer" {
        return Err(ApiError::Forbidden("Viewers cannot manage webhooks".into()));
    }

    sqlx::query("DELETE FROM webhook_endpoints WHERE id = $1 AND business_id = $2")
        .bind(endpoint_id)
        .bind(business_id)
        .execute(pool.get_ref())
        .await?;

    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, None, Some(&claims.email),
        "delete", "webhook_endpoint", Some(&endpoint_id.to_string()),
        None,
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::<()>::success((), "Webhook endpoint deleted")))
}

pub async fn list_deliveries(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<PaginationParams>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let deliveries: Vec<crate::db::WebhookDelivery> = sqlx::query_as(
        "SELECT * FROM webhook_deliveries WHERE business_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    )
    .bind(business_id)
    .bind(query.limit())
    .bind(query.offset())
    .fetch_all(pool.get_ref())
    .await?;

    let deliveries: Vec<WebhookDeliveryResponse> = deliveries.into_iter().map(Into::into).collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(deliveries, "Webhook deliveries retrieved")))
}

pub async fn get_delivery(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let delivery_id = path.into_inner();

    let delivery: Option<crate::db::WebhookDelivery> = sqlx::query_as(
        "SELECT * FROM webhook_deliveries WHERE id = $1 AND business_id = $2"
    )
    .bind(delivery_id)
    .bind(business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let delivery = delivery.ok_or_else(|| ApiError::NotFound("Delivery not found".into()))?;

    // Get the endpoint URL for context
    let endpoint_url: Option<(String,)> = sqlx::query_as(
        "SELECT url FROM webhook_endpoints WHERE id = $1"
    )
    .bind(delivery.endpoint_id)
    .fetch_optional(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {
            "id": delivery.id,
            "endpoint_id": delivery.endpoint_id,
            "endpoint_url": endpoint_url.map(|e| e.0),
            "event_type": delivery.event_type,
            "payload": delivery.payload,
            "status": delivery.status,
            "attempts": delivery.attempts,
            "max_attempts": delivery.max_attempts,
            "last_response_code": delivery.last_response_code,
            "last_response_body": delivery.last_response_body,
            "next_retry_at": delivery.next_retry_at,
            "created_at": delivery.created_at,
            "delivered_at": delivery.delivered_at,
        },
        "message": "Delivery retrieved"
    })))
}

pub async fn test_webhook(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    webhook_service: web::Data<crate::services::WebhookDeliveryService>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let test_payload = serde_json::json!({
        "session_id": Uuid::new_v4(),
        "amount": 1000.0,
        "merchant_ref": "test_ref",
        "status": "paid",
        "test": true,
    });

    webhook_service.dispatch(pool.get_ref(), business_id, "session.paid", test_payload).await;

    Ok(HttpResponse::Ok().json(ApiResponse::<()>::success((), "Test webhook dispatched to all active endpoints")))
}
