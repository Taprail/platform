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

    // Build dynamic WHERE clauses
    let mut conditions = vec!["business_id = $1".to_string()];
    let mut param_idx = 2u32;

    let _env_idx = if query.environment.is_some() {
        let idx = param_idx;
        conditions.push(format!("environment = ${}", idx));
        param_idx += 1;
        Some(idx)
    } else {
        None
    };

    let _status_idx = if query.status.is_some() {
        let idx = param_idx;
        conditions.push(format!("status = ${}", idx));
        param_idx += 1;
        Some(idx)
    } else {
        None
    };

    let _search_idx = if query.search.is_some() {
        let idx = param_idx;
        conditions.push(format!(
            "(id::text ILIKE '%' || ${idx} || '%' OR merchant_ref ILIKE '%' || ${idx} || '%' OR COALESCE(payment_reference, '') ILIKE '%' || ${idx} || '%')"
        ));
        param_idx += 1;
        Some(idx)
    } else {
        None
    };

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

    let _customer_idx = if query.customer_id.is_some() {
        let idx = param_idx;
        conditions.push(format!("customer_id = ${}::uuid", idx));
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
        "SELECT * FROM transactions WHERE {} ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
        where_clause, limit_idx, offset_idx
    );

    let count_sql = format!(
        "SELECT COUNT(*) FROM transactions WHERE {}",
        where_clause
    );

    // Build and execute the select query
    let mut select_q = sqlx::query_as::<_, crate::db::Transaction>(&select_sql)
        .bind(business_id);

    if let Some(ref env) = query.environment {
        select_q = select_q.bind(env);
    }
    if let Some(ref status) = query.status {
        select_q = select_q.bind(status);
    }
    if let Some(ref search) = query.search {
        select_q = select_q.bind(search);
    }
    if let Some(ref from) = query.from {
        select_q = select_q.bind(from);
    }
    if let Some(ref to) = query.to {
        select_q = select_q.bind(to);
    }
    if let Some(ref cid) = query.customer_id {
        select_q = select_q.bind(cid);
    }
    select_q = select_q.bind(query.limit()).bind(query.offset());

    let txns: Vec<crate::db::Transaction> = select_q.fetch_all(pool.get_ref()).await?;

    // Build and execute the count query
    let mut count_q = sqlx::query_as::<_, (i64,)>(&count_sql)
        .bind(business_id);

    if let Some(ref env) = query.environment {
        count_q = count_q.bind(env);
    }
    if let Some(ref status) = query.status {
        count_q = count_q.bind(status);
    }
    if let Some(ref search) = query.search {
        count_q = count_q.bind(search);
    }
    if let Some(ref from) = query.from {
        count_q = count_q.bind(from);
    }
    if let Some(ref to) = query.to {
        count_q = count_q.bind(to);
    }
    if let Some(ref cid) = query.customer_id {
        count_q = count_q.bind(cid);
    }

    let total: (i64,) = count_q.fetch_one(pool.get_ref()).await?;

    let txns: Vec<TransactionResponse> = txns.into_iter().map(Into::into).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": txns,
        "message": "Transactions retrieved",
        "total": total.0
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
