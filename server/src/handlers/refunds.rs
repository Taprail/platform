use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, CreateRefundRequest, RefundQuery, RefundResponse};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

pub async fn create_refund(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    webhook_service: web::Data<crate::services::WebhookDeliveryService>,
    body: web::Json<CreateRefundRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    if claims.role == "viewer" {
        return Err(ApiError::Forbidden("Viewers cannot create refunds".into()));
    }

    // Fetch the original transaction
    let txn: Option<crate::db::Transaction> = sqlx::query_as(
        "SELECT * FROM transactions WHERE id = $1 AND business_id = $2"
    )
    .bind(body.transaction_id)
    .bind(business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let txn = txn.ok_or_else(|| ApiError::NotFound("Transaction not found".into()))?;

    if txn.status != "success" {
        return Err(ApiError::BadRequest("Can only refund successful transactions".into()));
    }

    // Get the current refunded_amount from the DB (may not be on the Rust struct)
    let (refunded_amount,): (f64,) = sqlx::query_as(
        "SELECT COALESCE(refunded_amount, 0)::float8 FROM transactions WHERE id = $1"
    )
    .bind(txn.id)
    .fetch_one(pool.get_ref())
    .await?;

    let remaining = txn.amount - refunded_amount;

    let refund_amount = match body.amount {
        Some(amt) => {
            if amt <= 0.0 {
                return Err(ApiError::BadRequest("Refund amount must be greater than 0".into()));
            }
            if amt > remaining {
                return Err(ApiError::BadRequest(format!(
                    "Refund amount ({}) exceeds remaining refundable amount ({})",
                    amt, remaining
                )));
            }
            amt
        }
        None => {
            if remaining <= 0.0 {
                return Err(ApiError::BadRequest("Transaction has already been fully refunded".into()));
            }
            remaining
        }
    };

    let refund_id = Uuid::new_v4();
    let now = chrono::Utc::now();

    sqlx::query(
        "INSERT INTO refunds (id, business_id, transaction_id, amount, currency, reason, status, environment, created_at, completed_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
    )
    .bind(refund_id)
    .bind(business_id)
    .bind(body.transaction_id)
    .bind(refund_amount)
    .bind(&txn.currency)
    .bind(&body.reason)
    .bind("completed")
    .bind(&txn.environment)
    .bind(now)
    .bind(now)
    .execute(pool.get_ref())
    .await?;

    // Update the transaction's refunded_amount
    sqlx::query(
        "UPDATE transactions SET refunded_amount = COALESCE(refunded_amount, 0) + $1 WHERE id = $2"
    )
    .bind(refund_amount)
    .bind(body.transaction_id)
    .execute(pool.get_ref())
    .await?;

    // Dispatch webhook
    let refund_payload = serde_json::json!({
        "id": refund_id,
        "transaction_id": body.transaction_id,
        "amount": refund_amount,
        "currency": &txn.currency,
        "reason": &body.reason,
        "status": "completed",
        "environment": &txn.environment,
        "created_at": now,
    });
    webhook_service.dispatch(pool.get_ref(), business_id, "refund.created", refund_payload).await;

    // Audit log
    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, None, Some(&claims.email),
        "create", "refund", Some(&refund_id.to_string()),
        Some(serde_json::json!({
            "transaction_id": body.transaction_id,
            "amount": refund_amount,
            "reason": &body.reason,
        })),
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        RefundResponse {
            id: refund_id,
            transaction_id: body.transaction_id,
            amount: refund_amount,
            currency: txn.currency,
            reason: body.into_inner().reason,
            status: "completed".to_string(),
            provider_reference: None,
            idempotency_key: None,
            environment: txn.environment,
            created_at: now,
            completed_at: Some(now),
        },
        "Refund created",
    )))
}

pub async fn list_refunds(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<RefundQuery>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let mut conditions = vec!["business_id = $1".to_string()];
    let mut param_idx = 2u32;

    let _status_idx = if query.status.is_some() {
        let idx = param_idx;
        conditions.push(format!("status = ${}", idx));
        param_idx += 1;
        Some(idx)
    } else {
        None
    };

    let _env_idx = if query.environment.is_some() {
        let idx = param_idx;
        conditions.push(format!("environment = ${}", idx));
        param_idx += 1;
        Some(idx)
    } else {
        None
    };

    let limit_idx = param_idx;
    param_idx += 1;
    let offset_idx = param_idx;

    let where_clause = conditions.join(" AND ");

    let select_sql = format!(
        "SELECT * FROM refunds WHERE {} ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
        where_clause, limit_idx, offset_idx
    );

    let count_sql = format!(
        "SELECT COUNT(*) FROM refunds WHERE {}",
        where_clause
    );

    // Build and execute the select query
    let mut select_q = sqlx::query_as::<_, crate::db::Refund>(&select_sql)
        .bind(business_id);

    if let Some(ref status) = query.status {
        select_q = select_q.bind(status);
    }
    if let Some(ref env) = query.environment {
        select_q = select_q.bind(env);
    }
    select_q = select_q.bind(query.limit()).bind(query.offset());

    let refunds: Vec<crate::db::Refund> = select_q.fetch_all(pool.get_ref()).await?;

    // Build and execute the count query
    let mut count_q = sqlx::query_as::<_, (i64,)>(&count_sql)
        .bind(business_id);

    if let Some(ref status) = query.status {
        count_q = count_q.bind(status);
    }
    if let Some(ref env) = query.environment {
        count_q = count_q.bind(env);
    }

    let total: (i64,) = count_q.fetch_one(pool.get_ref()).await?;

    let refunds: Vec<RefundResponse> = refunds.into_iter().map(Into::into).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": refunds,
        "message": "Refunds retrieved",
        "total": total.0
    })))
}

pub async fn get_refund(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let refund_id = path.into_inner();

    let refund: Option<crate::db::Refund> = sqlx::query_as(
        "SELECT * FROM refunds WHERE id = $1 AND business_id = $2"
    )
    .bind(refund_id)
    .bind(business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let refund = refund.ok_or_else(|| ApiError::NotFound("Refund not found".into()))?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        RefundResponse::from(refund),
        "Refund retrieved",
    )))
}
