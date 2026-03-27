use actix_web::{web, HttpRequest, HttpResponse};
use rand::Rng;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiKeyCreatedResponse, ApiKeyResponse, ApiResponse, CreateApiKeyRequest};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

fn generate_raw_key(prefix: &str) -> String {
    let random_part: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    format!("{}_{}", prefix, random_part)
}

fn hash_key(key: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(key.as_bytes());
    hex::encode(hasher.finalize())
}

pub async fn create_api_keys(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<CreateApiKeyRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    if claims.role == "viewer" {
        return Err(ApiError::Forbidden("Viewers cannot create API keys".into()));
    }

    let label = body.label.clone().unwrap_or_else(|| "Default".to_string());

    // Check KYB status for live key eligibility
    let business: crate::db::Business = sqlx::query_as(
        "SELECT * FROM businesses WHERE id = $1"
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    let kyb_approved = business.kyb_status == "approved";

    let test_key = generate_raw_key("symble_test");
    let test_hash = hash_key(&test_key);
    let test_last4 = &test_key[test_key.len() - 4..];
    let test_id = Uuid::new_v4();

    if kyb_approved {
        let live_key = generate_raw_key("symble_live");
        let live_hash = hash_key(&live_key);
        let live_last4 = &live_key[live_key.len() - 4..];
        let live_id = Uuid::new_v4();

        sqlx::query(
            "INSERT INTO api_keys (id, business_id, label, key_prefix, key_hash, last4, environment) \
             VALUES ($1, $2, $3, 'symble_test', $4, $5, 'test'), \
                    ($6, $7, $8, 'symble_live', $9, $10, 'live')"
        )
        .bind(test_id).bind(business_id).bind(&label).bind(&test_hash).bind(test_last4)
        .bind(live_id).bind(business_id).bind(&label).bind(&live_hash).bind(live_last4)
        .execute(pool.get_ref())
        .await?;

        crate::handlers::audit::log_audit(
            pool.get_ref(), business_id, None, Some(&claims.email),
            "create", "api_key", Some(&format!("{},{}", test_id, live_id)),
            Some(serde_json::json!({"label": &label})),
            crate::handlers::audit::get_ip(&req).as_deref(),
        ).await;

        Ok(HttpResponse::Ok().json(ApiResponse::success(
            ApiKeyCreatedResponse {
                test_key,
                live_key,
                test_key_id: test_id,
                live_key_id: live_id,
            },
            "API keys created. Store these securely - they won't be shown again.",
        )))
    } else {
        sqlx::query(
            "INSERT INTO api_keys (id, business_id, label, key_prefix, key_hash, last4, environment) \
             VALUES ($1, $2, $3, 'symble_test', $4, $5, 'test')"
        )
        .bind(test_id).bind(business_id).bind(&label).bind(&test_hash).bind(test_last4)
        .execute(pool.get_ref())
        .await?;

        crate::handlers::audit::log_audit(
            pool.get_ref(), business_id, None, Some(&claims.email),
            "create", "api_key", Some(&test_id.to_string()),
            Some(serde_json::json!({"label": &label, "live_key_skipped": true})),
            crate::handlers::audit::get_ip(&req).as_deref(),
        ).await;

        Ok(HttpResponse::Ok().json(serde_json::json!({
            "success": true,
            "data": {
                "test_key": test_key,
                "test_key_id": test_id,
                "live_key": null,
                "live_key_id": null,
            },
            "message": "Test API key created. Complete KYB verification to get live API keys."
        })))
    }
}

pub async fn list_api_keys(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let keys: Vec<crate::db::ApiKey> = sqlx::query_as(
        "SELECT * FROM api_keys WHERE business_id = $1 ORDER BY created_at DESC"
    )
    .bind(business_id)
    .fetch_all(pool.get_ref())
    .await?;

    let keys: Vec<ApiKeyResponse> = keys.into_iter().map(Into::into).collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(keys, "API keys retrieved")))
}

pub async fn revoke_api_key(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let key_id = path.into_inner();

    if claims.role == "viewer" || claims.role == "member" {
        return Err(ApiError::Forbidden("Insufficient permissions".into()));
    }

    let result = sqlx::query(
        "UPDATE api_keys SET is_active = FALSE WHERE id = $1 AND business_id = $2"
    )
    .bind(key_id)
    .bind(business_id)
    .execute(pool.get_ref())
    .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("API key not found".into()));
    }

    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, None, Some(&claims.email),
        "revoke", "api_key", Some(&key_id.to_string()),
        None,
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::<()>::success((), "API key revoked")))
}
