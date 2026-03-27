use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, SettlementQuery, SettlementResponse};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

#[derive(Debug, serde::Deserialize)]
pub struct UpdateBankAccountRequest {
    pub bank_name: String,
    pub account_number: String,
    pub account_name: String,
}

pub async fn list_settlements(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<SettlementQuery>,
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
        "SELECT * FROM settlements WHERE {} ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
        where_clause, limit_idx, offset_idx
    );

    let count_sql = format!(
        "SELECT COUNT(*) FROM settlements WHERE {}",
        where_clause
    );

    // Build and execute the select query
    let mut select_q = sqlx::query_as::<_, crate::db::Settlement>(&select_sql)
        .bind(business_id);

    if let Some(ref status) = query.status {
        select_q = select_q.bind(status);
    }
    if let Some(ref env) = query.environment {
        select_q = select_q.bind(env);
    }
    select_q = select_q.bind(query.limit()).bind(query.offset());

    let settlements: Vec<crate::db::Settlement> = select_q.fetch_all(pool.get_ref()).await?;

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

    let settlements: Vec<SettlementResponse> = settlements.into_iter().map(Into::into).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": settlements,
        "message": "Settlements retrieved",
        "total": total.0
    })))
}

pub async fn get_settlement(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let settlement_id = path.into_inner();

    let settlement: Option<crate::db::Settlement> = sqlx::query_as(
        "SELECT * FROM settlements WHERE id = $1 AND business_id = $2"
    )
    .bind(settlement_id)
    .bind(business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let settlement = settlement.ok_or_else(|| ApiError::NotFound("Settlement not found".into()))?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        SettlementResponse::from(settlement),
        "Settlement retrieved",
    )))
}

pub async fn get_settlement_items(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let settlement_id = path.into_inner();

    // Verify the settlement belongs to this business
    let exists: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM settlements WHERE id = $1 AND business_id = $2"
    )
    .bind(settlement_id)
    .bind(business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    if exists.is_none() {
        return Err(ApiError::NotFound("Settlement not found".into()));
    }

    let rows = sqlx::query_as::<_, (Uuid, Uuid, f64, f64, Option<String>, Option<String>, String)>(
        "SELECT si.id, si.transaction_id, si.amount, si.fee, t.merchant_ref, t.payment_reference, t.status as txn_status \
         FROM settlement_items si \
         JOIN transactions t ON t.id = si.transaction_id \
         WHERE si.settlement_id = $1"
    )
    .bind(settlement_id)
    .fetch_all(pool.get_ref())
    .await?;

    let items: Vec<serde_json::Value> = rows.into_iter().map(|r| {
        serde_json::json!({
            "id": r.0,
            "transaction_id": r.1,
            "amount": r.2,
            "fee": r.3,
            "merchant_ref": r.4,
            "payment_reference": r.5,
            "txn_status": r.6,
        })
    }).collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(items, "Settlement items retrieved")))
}

pub async fn get_bank_account(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let row: Option<(Option<String>, Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT bank_name, bank_account_number, bank_account_name FROM businesses WHERE id = $1"
    )
    .bind(business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let row = row.ok_or_else(|| ApiError::NotFound("Business not found".into()))?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        serde_json::json!({
            "bank_name": row.0,
            "account_number": row.1,
            "account_name": row.2,
        }),
        "Bank account retrieved",
    )))
}

pub async fn update_bank_account(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<UpdateBankAccountRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    if claims.role == "viewer" {
        return Err(ApiError::Forbidden("Viewers cannot update bank account".into()));
    }

    sqlx::query(
        "UPDATE businesses SET bank_name = $1, bank_account_number = $2, bank_account_name = $3 WHERE id = $4"
    )
    .bind(&body.bank_name)
    .bind(&body.account_number)
    .bind(&body.account_name)
    .bind(business_id)
    .execute(pool.get_ref())
    .await?;

    // Audit log
    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, None, Some(&claims.email),
        "update", "bank_account", Some(&business_id.to_string()),
        Some(serde_json::json!({
            "bank_name": &body.bank_name,
            "account_number": &body.account_number,
            "account_name": &body.account_name,
        })),
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::<()>::success((), "Bank account updated")))
}
