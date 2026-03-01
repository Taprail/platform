use actix_web::{web, HttpRequest, HttpResponse};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::ApiResponse;
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

#[derive(Debug, Serialize)]
pub struct OverviewStats {
    pub total_volume: f64,
    pub total_transactions: i64,
    pub success_rate: f64,
    pub active_sessions: i64,
    pub volume_change_pct: f64,
    pub txn_count_change_pct: f64,
}

#[derive(Debug, Serialize)]
pub struct ChartPoint {
    pub date: String,
    pub volume: f64,
    pub count: i64,
}

#[derive(Debug, serde::Deserialize)]
pub struct ChartQuery {
    pub period: Option<String>,
}

pub async fn get_overview(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    // Current period stats (last 30 days)
    let stats: (Option<f64>, Option<i64>) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount), 0), COUNT(*) \
         FROM transactions \
         WHERE business_id = $1 AND status = 'success' \
         AND created_at >= NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    let total_volume = stats.0.unwrap_or(0.0);
    let total_transactions = stats.1.unwrap_or(0);

    // Success rate
    let total_all: (Option<i64>,) = sqlx::query_as(
        "SELECT COUNT(*) FROM transactions WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    let success_rate = if total_all.0.unwrap_or(0) > 0 {
        (total_transactions as f64 / total_all.0.unwrap_or(1) as f64) * 100.0
    } else {
        0.0
    };

    // Active sessions
    let active: (Option<i64>,) = sqlx::query_as(
        "SELECT COUNT(*) FROM payment_sessions WHERE business_id = $1 AND status IN ('pending', 'locked')"
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    // Previous period for comparison (30-60 days ago)
    let prev_stats: (Option<f64>, Option<i64>) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount), 0), COUNT(*) \
         FROM transactions \
         WHERE business_id = $1 AND status = 'success' \
         AND created_at >= NOW() - INTERVAL '60 days' \
         AND created_at < NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    let prev_volume = prev_stats.0.unwrap_or(0.0);
    let prev_count = prev_stats.1.unwrap_or(0);

    let volume_change = if prev_volume > 0.0 {
        ((total_volume - prev_volume) / prev_volume) * 100.0
    } else {
        0.0
    };

    let count_change = if prev_count > 0 {
        ((total_transactions - prev_count) as f64 / prev_count as f64) * 100.0
    } else {
        0.0
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        OverviewStats {
            total_volume,
            total_transactions,
            success_rate,
            active_sessions: active.0.unwrap_or(0),
            volume_change_pct: volume_change,
            txn_count_change_pct: count_change,
        },
        "Overview stats retrieved",
    )))
}

pub async fn get_chart(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<ChartQuery>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let days = match query.period.as_deref() {
        Some("7d") => 7,
        Some("30d") => 30,
        Some("90d") => 90,
        _ => 7,
    };

    let rows: Vec<(String, Option<f64>, Option<i64>)> = sqlx::query_as(
        "SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD'), \
                COALESCE(SUM(amount), 0), COUNT(*) \
         FROM transactions \
         WHERE business_id = $1 AND status = 'success' \
         AND created_at >= NOW() - make_interval(days => $2) \
         GROUP BY created_at::date \
         ORDER BY created_at::date"
    )
    .bind(business_id)
    .bind(days)
    .fetch_all(pool.get_ref())
    .await?;

    let series: Vec<ChartPoint> = rows
        .into_iter()
        .map(|(date, volume, count)| ChartPoint {
            date,
            volume: volume.unwrap_or(0.0),
            count: count.unwrap_or(0),
        })
        .collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(series, "Chart data retrieved")))
}
