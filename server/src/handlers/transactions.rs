use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, TransactionQuery, TransactionResponse};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

pub async fn list_transactions(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<TransactionQuery>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let (txns, total): (Vec<crate::db::Transaction>, i64) = if let Some(ref status) = query.status {
        let txns: Vec<crate::db::Transaction> = sqlx::query_as(
            "SELECT * FROM transactions WHERE business_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4"
        )
        .bind(business_id)
        .bind(status)
        .bind(query.limit())
        .bind(query.offset())
        .fetch_all(pool.get_ref())
        .await?;

        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM transactions WHERE business_id = $1 AND status = $2"
        )
        .bind(business_id)
        .bind(status)
        .fetch_one(pool.get_ref())
        .await?;

        (txns, total.0)
    } else {
        let txns: Vec<crate::db::Transaction> = sqlx::query_as(
            "SELECT * FROM transactions WHERE business_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
        )
        .bind(business_id)
        .bind(query.limit())
        .bind(query.offset())
        .fetch_all(pool.get_ref())
        .await?;

        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM transactions WHERE business_id = $1"
        )
        .bind(business_id)
        .fetch_one(pool.get_ref())
        .await?;

        (txns, total.0)
    };

    let txns: Vec<TransactionResponse> = txns.into_iter().map(Into::into).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": txns,
        "message": "Transactions retrieved",
        "total": total
    })))
}

pub async fn get_transaction(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let txn_id = path.into_inner();

    let txn: Option<crate::db::Transaction> = sqlx::query_as(
        "SELECT * FROM transactions WHERE id = $1 AND business_id = $2"
    )
    .bind(txn_id)
    .bind(business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let txn = txn.ok_or_else(|| ApiError::NotFound("Transaction not found".into()))?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        TransactionResponse::from(txn),
        "Transaction retrieved",
    )))
}
