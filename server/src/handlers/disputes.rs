use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, Dispute, DisputeQuery, DisputeResponse, UpdateDisputeRequest};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

const VALID_STATUSES: &[&str] = &["open", "under_review", "won", "lost", "closed"];
const RESOLVED_STATUSES: &[&str] = &["won", "lost", "closed"];

pub async fn list_disputes(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<DisputeQuery>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let (disputes, total) = if let Some(ref status) = query.status {
        let disputes: Vec<Dispute> = sqlx::query_as(
            "SELECT * FROM disputes WHERE business_id = $1 AND status = $2 \
             ORDER BY created_at DESC LIMIT $3 OFFSET $4",
        )
        .bind(business_id)
        .bind(status)
        .bind(query.limit())
        .bind(query.offset())
        .fetch_all(pool.get_ref())
        .await?;

        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM disputes WHERE business_id = $1 AND status = $2",
        )
        .bind(business_id)
        .bind(status)
        .fetch_one(pool.get_ref())
        .await?;

        (disputes, total.0)
    } else {
        let disputes: Vec<Dispute> = sqlx::query_as(
            "SELECT * FROM disputes WHERE business_id = $1 \
             ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        )
        .bind(business_id)
        .bind(query.limit())
        .bind(query.offset())
        .fetch_all(pool.get_ref())
        .await?;

        let total: (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM disputes WHERE business_id = $1")
                .bind(business_id)
                .fetch_one(pool.get_ref())
                .await?;

        (disputes, total.0)
    };

    let responses: Vec<DisputeResponse> = disputes.into_iter().map(Into::into).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": responses,
        "message": "Disputes retrieved",
        "total": total
    })))
}

pub async fn get_dispute(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let dispute_id = path.into_inner();

    let dispute: Option<Dispute> =
        sqlx::query_as("SELECT * FROM disputes WHERE id = $1 AND business_id = $2")
            .bind(dispute_id)
            .bind(business_id)
            .fetch_optional(pool.get_ref())
            .await?;

    let dispute = dispute.ok_or_else(|| ApiError::NotFound("Dispute not found".into()))?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        DisputeResponse::from(dispute),
        "Dispute retrieved",
    )))
}

pub async fn update_dispute(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateDisputeRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    // Viewers cannot update disputes
    if claims.role == "viewer" {
        return Err(ApiError::Forbidden(
            "Viewers cannot update disputes".into(),
        ));
    }

    let member_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| ApiError::Internal("Invalid member ID".into()))?;

    let dispute_id = path.into_inner();

    // Validate status if provided
    if let Some(ref status) = body.status {
        if !VALID_STATUSES.contains(&status.as_str()) {
            return Err(ApiError::BadRequest(format!(
                "Invalid status '{}'. Must be one of: {}",
                status,
                VALID_STATUSES.join(", ")
            )));
        }
    }

    // Determine whether to set resolved_at
    let is_resolved = body
        .status
        .as_ref()
        .map(|s| RESOLVED_STATUSES.contains(&s.as_str()))
        .unwrap_or(false);

    let result = if is_resolved {
        sqlx::query(
            "UPDATE disputes SET \
             evidence = COALESCE($1, evidence), \
             status = COALESCE($2, status), \
             resolved_at = NOW() \
             WHERE id = $3 AND business_id = $4",
        )
        .bind(&body.evidence)
        .bind(&body.status)
        .bind(dispute_id)
        .bind(business_id)
        .execute(pool.get_ref())
        .await?
    } else {
        sqlx::query(
            "UPDATE disputes SET \
             evidence = COALESCE($1, evidence), \
             status = COALESCE($2, status) \
             WHERE id = $3 AND business_id = $4",
        )
        .bind(&body.evidence)
        .bind(&body.status)
        .bind(dispute_id)
        .bind(business_id)
        .execute(pool.get_ref())
        .await?
    };

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("Dispute not found".into()));
    }

    // Audit log
    crate::handlers::audit::log_audit(
        pool.get_ref(),
        business_id,
        Some(member_id),
        Some(&claims.email),
        "update",
        "dispute",
        Some(&dispute_id.to_string()),
        Some(serde_json::json!({
            "evidence": &body.evidence,
            "status": &body.status,
        })),
        crate::handlers::audit::get_ip(&req).as_deref(),
    )
    .await;

    // Fetch and return updated dispute
    let dispute: Dispute = sqlx::query_as("SELECT * FROM disputes WHERE id = $1")
        .bind(dispute_id)
        .fetch_one(pool.get_ref())
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        DisputeResponse::from(dispute),
        "Dispute updated",
    )))
}
