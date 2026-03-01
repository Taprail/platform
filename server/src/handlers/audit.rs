use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, AuditLogEntry, PaginationParams};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

pub async fn get_audit_log(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<PaginationParams>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let entries: Vec<AuditLogEntry> = sqlx::query_as(
        "SELECT id, actor_email, action, resource_type, resource_id, details, ip_address, created_at \
         FROM audit_logs WHERE business_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    )
    .bind(business_id)
    .bind(query.limit())
    .bind(query.offset())
    .fetch_all(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(entries, "Audit log retrieved")))
}

pub fn get_ip(req: &HttpRequest) -> Option<String> {
    req.peer_addr().map(|addr| addr.ip().to_string())
}

pub async fn log_audit(
    pool: &PgPool,
    business_id: Uuid,
    actor_id: Option<Uuid>,
    actor_email: Option<&str>,
    action: &str,
    resource_type: &str,
    resource_id: Option<&str>,
    details: Option<serde_json::Value>,
    ip_address: Option<&str>,
) {
    let _ = sqlx::query(
        "INSERT INTO audit_logs (business_id, actor_id, actor_email, action, resource_type, resource_id, details, ip_address) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
    )
    .bind(business_id)
    .bind(actor_id)
    .bind(actor_email)
    .bind(action)
    .bind(resource_type)
    .bind(resource_id)
    .bind(details)
    .bind(ip_address)
    .execute(pool)
    .await;
}
