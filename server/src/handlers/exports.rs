use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

#[derive(Debug, serde::Deserialize)]
pub struct ExportQuery {
    pub resource: String,
    pub from: Option<String>,
    pub to: Option<String>,
    pub status: Option<String>,
    pub env: Option<String>,
}

fn csv_escape(val: &str) -> String {
    if val.contains(',') || val.contains('"') || val.contains('\n') {
        format!("\"{}\"", val.replace('"', "\"\""))
    } else {
        val.to_string()
    }
}

pub async fn export_csv(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<ExportQuery>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let csv = match query.resource.as_str() {
        "transactions" => export_transactions(&pool, business_id, &query).await?,
        "refunds" => export_refunds(&pool, business_id, &query).await?,
        "settlements" => export_settlements(&pool, business_id, &query).await?,
        "customers" => export_customers(&pool, business_id, &query).await?,
        _ => return Err(ApiError::BadRequest(format!("Unknown export resource: {}", query.resource))),
    };

    Ok(HttpResponse::Ok()
        .content_type("text/csv")
        .insert_header(("Content-Disposition", format!("attachment; filename=\"{}_export.csv\"", query.resource)))
        .body(csv))
}

async fn export_transactions(
    pool: &PgPool,
    business_id: Uuid,
    query: &ExportQuery,
) -> Result<String, ApiError> {
    let mut sql = String::from(
        "SELECT id, amount, fee, net_amount, currency, status, payment_reference, merchant_ref, environment, created_at \
         FROM transactions WHERE business_id = $1"
    );
    let mut param_idx = 2;

    if query.from.is_some() {
        sql.push_str(&format!(" AND created_at >= ${}", param_idx));
        param_idx += 1;
    }
    if query.to.is_some() {
        sql.push_str(&format!(" AND created_at <= ${}", param_idx));
        param_idx += 1;
    }
    if query.status.is_some() {
        sql.push_str(&format!(" AND status = ${}", param_idx));
        param_idx += 1;
    }
    if query.env.is_some() {
        sql.push_str(&format!(" AND environment = ${}", param_idx));
        // param_idx += 1;
    }

    sql.push_str(" ORDER BY created_at DESC LIMIT 10000");

    let mut q = sqlx::query_as::<_, (
        Uuid, f64, f64, f64, String, String, String, Option<String>, String, chrono::NaiveDateTime,
    )>(&sql)
    .bind(business_id);

    if let Some(ref from) = query.from {
        q = q.bind(from.clone());
    }
    if let Some(ref to) = query.to {
        q = q.bind(to.clone());
    }
    if let Some(ref status) = query.status {
        q = q.bind(status.clone());
    }
    if let Some(ref env) = query.env {
        q = q.bind(env.clone());
    }

    let rows = q.fetch_all(pool).await?;

    let mut csv = String::from("id,amount,fee,net_amount,currency,status,payment_reference,merchant_ref,environment,created_at\n");
    for row in rows {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{},{},{}\n",
            csv_escape(&row.0.to_string()),
            row.1,
            row.2,
            row.3,
            csv_escape(&row.4),
            csv_escape(&row.5),
            csv_escape(&row.6),
            csv_escape(&row.7.unwrap_or_default()),
            csv_escape(&row.8),
            csv_escape(&row.9.to_string()),
        ));
    }

    Ok(csv)
}

async fn export_refunds(
    pool: &PgPool,
    business_id: Uuid,
    query: &ExportQuery,
) -> Result<String, ApiError> {
    let mut sql = String::from(
        "SELECT id, amount, currency, status, reason, transaction_id, created_at \
         FROM refunds WHERE business_id = $1"
    );
    let mut param_idx = 2;

    if query.from.is_some() {
        sql.push_str(&format!(" AND created_at >= ${}", param_idx));
        param_idx += 1;
    }
    if query.to.is_some() {
        sql.push_str(&format!(" AND created_at <= ${}", param_idx));
        param_idx += 1;
    }
    if query.status.is_some() {
        sql.push_str(&format!(" AND status = ${}", param_idx));
        // param_idx += 1;
    }

    sql.push_str(" ORDER BY created_at DESC LIMIT 10000");

    let mut q = sqlx::query_as::<_, (
        Uuid, f64, String, String, Option<String>, Uuid, chrono::NaiveDateTime,
    )>(&sql)
    .bind(business_id);

    if let Some(ref from) = query.from {
        q = q.bind(from.clone());
    }
    if let Some(ref to) = query.to {
        q = q.bind(to.clone());
    }
    if let Some(ref status) = query.status {
        q = q.bind(status.clone());
    }

    let rows = q.fetch_all(pool).await?;

    let mut csv = String::from("id,amount,currency,status,reason,transaction_id,created_at\n");
    for row in rows {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{}\n",
            csv_escape(&row.0.to_string()),
            row.1,
            csv_escape(&row.2),
            csv_escape(&row.3),
            csv_escape(&row.4.unwrap_or_default()),
            csv_escape(&row.5.to_string()),
            csv_escape(&row.6.to_string()),
        ));
    }

    Ok(csv)
}

async fn export_settlements(
    pool: &PgPool,
    business_id: Uuid,
    query: &ExportQuery,
) -> Result<String, ApiError> {
    let mut sql = String::from(
        "SELECT id, amount, fee, net_amount, currency, status, created_at \
         FROM settlements WHERE business_id = $1"
    );
    let mut param_idx = 2;

    if query.from.is_some() {
        sql.push_str(&format!(" AND created_at >= ${}", param_idx));
        param_idx += 1;
    }
    if query.to.is_some() {
        sql.push_str(&format!(" AND created_at <= ${}", param_idx));
        param_idx += 1;
    }
    if query.status.is_some() {
        sql.push_str(&format!(" AND status = ${}", param_idx));
        // param_idx += 1;
    }

    sql.push_str(" ORDER BY created_at DESC LIMIT 10000");

    let mut q = sqlx::query_as::<_, (
        Uuid, f64, f64, f64, String, String, chrono::NaiveDateTime,
    )>(&sql)
    .bind(business_id);

    if let Some(ref from) = query.from {
        q = q.bind(from.clone());
    }
    if let Some(ref to) = query.to {
        q = q.bind(to.clone());
    }
    if let Some(ref status) = query.status {
        q = q.bind(status.clone());
    }

    let rows = q.fetch_all(pool).await?;

    let mut csv = String::from("id,amount,fee,net_amount,currency,status,created_at\n");
    for row in rows {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{}\n",
            csv_escape(&row.0.to_string()),
            row.1,
            row.2,
            row.3,
            csv_escape(&row.4),
            csv_escape(&row.5),
            csv_escape(&row.6.to_string()),
        ));
    }

    Ok(csv)
}

async fn export_customers(
    pool: &PgPool,
    business_id: Uuid,
    _query: &ExportQuery,
) -> Result<String, ApiError> {
    let rows = sqlx::query_as::<_, (
        Uuid, Option<String>, Option<String>, Option<String>, chrono::NaiveDateTime,
    )>(
        "SELECT id, email, phone, name, created_at \
         FROM customers WHERE business_id = $1 \
         ORDER BY created_at DESC LIMIT 10000"
    )
    .bind(business_id)
    .fetch_all(pool)
    .await?;

    let mut csv = String::from("id,email,phone,name,created_at\n");
    for row in rows {
        csv.push_str(&format!(
            "{},{},{},{},{}\n",
            csv_escape(&row.0.to_string()),
            csv_escape(&row.1.unwrap_or_default()),
            csv_escape(&row.2.unwrap_or_default()),
            csv_escape(&row.3.unwrap_or_default()),
            csv_escape(&row.4.to_string()),
        ));
    }

    Ok(csv)
}
