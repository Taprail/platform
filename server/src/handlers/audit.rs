use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, AuditLogEntry};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

#[derive(Debug, serde::Deserialize)]
pub struct AuditQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub from: Option<String>,
    pub to: Option<String>,
}

impl AuditQuery {
    pub fn limit(&self) -> i64 {
        self.limit.unwrap_or(50).min(100)
    }
    pub fn offset(&self) -> i64 {
        self.offset.unwrap_or(0)
    }
}

pub async fn get_audit_log(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<AuditQuery>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let mut conditions = vec!["business_id = $1".to_string()];
    let mut param_idx = 2u32;

    let _from_idx = if query.from.is_some() {
        let idx = param_idx;
        conditions.push(format!("created_at >= ${}::timestamptz", idx));
        param_idx += 1;
        Some(idx)
    } else {
        None
    };

    let _to_idx = if query.to.is_some() {
        let idx = param_idx;
        conditions.push(format!("created_at <= ${}::timestamptz", idx));
        param_idx += 1;
        Some(idx)
    } else {
        None
    };

    let limit_idx = param_idx;
    param_idx += 1;
    let offset_idx = param_idx;

    let where_clause = conditions.join(" AND ");

    let sql = format!(
        "SELECT id, actor_email, action, resource_type, resource_id, details, ip_address, created_at \
         FROM audit_logs WHERE {} ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
        where_clause, limit_idx, offset_idx
    );

    let mut q = sqlx::query_as::<_, AuditLogEntry>(&sql)
        .bind(business_id);

    if let Some(ref from) = query.from {
        q = q.bind(from);
    }
    if let Some(ref to) = query.to {
        q = q.bind(to);
    }

    q = q.bind(query.limit()).bind(query.offset());

    let entries: Vec<AuditLogEntry> = q.fetch_all(pool.get_ref()).await?;

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
