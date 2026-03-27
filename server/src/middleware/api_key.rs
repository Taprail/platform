use actix_web::HttpRequest;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::ApiError;

#[derive(Debug, Clone)]
pub struct BusinessContext {
    pub business_id: Uuid,
    pub tier: String,
    pub environment: String,
    pub fee_percent: f64,
    pub fee_cap: f64,
    pub scopes: Vec<String>,
}

pub async fn extract_business_context(
    req: &HttpRequest,
    pool: &PgPool,
) -> Result<BusinessContext, ApiError> {
    let raw_key = req
        .headers()
        .get("X-Beam-Key")
        .or_else(|| req.headers().get("Authorization"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.strip_prefix("Bearer ").unwrap_or(s))
        .ok_or_else(|| ApiError::Unauthorized("Missing API key".into()))?;

    let mut hasher = Sha256::new();
    hasher.update(raw_key.as_bytes());
    let key_hash = hex::encode(hasher.finalize());

    let row: Option<(Uuid, String, String, f64, f64, Vec<String>)> = sqlx::query_as(
        "SELECT b.id, b.tier, ak.environment, b.fee_percent, b.fee_cap, ak.scopes \
         FROM api_keys ak \
         JOIN businesses b ON ak.business_id = b.id \
         WHERE ak.key_hash = $1 AND ak.is_active = TRUE AND b.status = 'active'"
    )
    .bind(&key_hash)
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    let (business_id, tier, environment, fee_percent, fee_cap, scopes) =
        row.ok_or_else(|| ApiError::Unauthorized("Invalid API key".into()))?;

    // Update last_used_at
    let _ = sqlx::query("UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = $1")
        .bind(&key_hash)
        .execute(pool)
        .await;

    Ok(BusinessContext {
        business_id,
        tier,
        environment,
        fee_percent,
        fee_cap,
        scopes,
    })
}
