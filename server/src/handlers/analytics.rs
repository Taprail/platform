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
    pub success_count: i64,
    pub failed_count: i64,
    pub pending_count: i64,
    pub revenue: f64,
    pub prev_revenue: f64,
    pub has_api_keys: bool,
    pub has_webhooks: bool,
    pub has_transactions: bool,
    pub kyb_status: String,
}

#[derive(Debug, Serialize)]
pub struct ChartPoint {
    pub date: String,
    pub volume: f64,
    pub count: i64,
    pub success_count: i64,
    pub failed_count: i64,
}

#[derive(Debug, serde::Deserialize)]
pub struct OverviewQuery {
    pub env: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct ChartQuery {
    pub period: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
    pub env: Option<String>,
}

pub async fn get_overview(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<OverviewQuery>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let env = query.env.as_deref().unwrap_or("test");

    // Current period stats (last 30 days)
    let stats: (Option<f64>, Option<i64>) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount), 0), COUNT(*) \
         FROM transactions \
         WHERE business_id = $1 AND status = 'success' AND environment = $2 \
         AND created_at >= NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .bind(env)
    .fetch_one(pool.get_ref())
    .await?;

    let total_volume = stats.0.unwrap_or(0.0);
    let total_transactions = stats.1.unwrap_or(0);

    // Success rate
    let total_all: (Option<i64>,) = sqlx::query_as(
        "SELECT COUNT(*) FROM transactions WHERE business_id = $1 AND environment = $2 AND created_at >= NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .bind(env)
    .fetch_one(pool.get_ref())
    .await?;

    let success_rate = if total_all.0.unwrap_or(0) > 0 {
        (total_transactions as f64 / total_all.0.unwrap_or(1) as f64) * 100.0
    } else {
        0.0
    };

    // Active sessions
    let active: (Option<i64>,) = sqlx::query_as(
        "SELECT COUNT(*) FROM payment_sessions WHERE business_id = $1 AND environment = $2 AND status IN ('pending', 'locked')"
    )
    .bind(business_id)
    .bind(env)
    .fetch_one(pool.get_ref())
    .await?;

    // Previous period for comparison (30-60 days ago)
    let prev_stats: (Option<f64>, Option<i64>) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount), 0), COUNT(*) \
         FROM transactions \
         WHERE business_id = $1 AND status = 'success' AND environment = $2 \
         AND created_at >= NOW() - INTERVAL '60 days' \
         AND created_at < NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .bind(env)
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

    // Status counts (last 30 days)
    let success_count: (Option<i64>,) = sqlx::query_as(
        "SELECT COUNT(*) FROM transactions WHERE business_id = $1 AND environment = $2 AND status = 'success' AND created_at >= NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .bind(env)
    .fetch_one(pool.get_ref())
    .await?;

    let failed_count: (Option<i64>,) = sqlx::query_as(
        "SELECT COUNT(*) FROM transactions WHERE business_id = $1 AND environment = $2 AND status = 'failed' AND created_at >= NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .bind(env)
    .fetch_one(pool.get_ref())
    .await?;

    let pending_count: (Option<i64>,) = sqlx::query_as(
        "SELECT COUNT(*) FROM transactions WHERE business_id = $1 AND environment = $2 AND status = 'pending' AND created_at >= NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .bind(env)
    .fetch_one(pool.get_ref())
    .await?;

    // Revenue (sum of fees, current period)
    let revenue_row: (Option<f64>,) = sqlx::query_as(
        "SELECT COALESCE(SUM(fee), 0) FROM transactions WHERE business_id = $1 AND environment = $2 AND status = 'success' AND created_at >= NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .bind(env)
    .fetch_one(pool.get_ref())
    .await?;

    // Previous period revenue
    let prev_revenue_row: (Option<f64>,) = sqlx::query_as(
        "SELECT COALESCE(SUM(fee), 0) FROM transactions WHERE business_id = $1 AND environment = $2 AND status = 'success' \
         AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'"
    )
    .bind(business_id)
    .bind(env)
    .fetch_one(pool.get_ref())
    .await?;

    // Boolean flags (not scoped to env)
    let has_api_keys: (bool,) = sqlx::query_as(
        "SELECT EXISTS(SELECT 1 FROM api_keys WHERE business_id = $1)"
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    let has_webhooks: (bool,) = sqlx::query_as(
        "SELECT EXISTS(SELECT 1 FROM webhook_endpoints WHERE business_id = $1)"
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    let has_transactions: (bool,) = sqlx::query_as(
        "SELECT EXISTS(SELECT 1 FROM transactions WHERE business_id = $1)"
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    // KYB status
    let kyb_row: (String,) = sqlx::query_as(
        "SELECT kyb_status FROM businesses WHERE id = $1"
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        OverviewStats {
            total_volume,
            total_transactions,
            success_rate,
            active_sessions: active.0.unwrap_or(0),
            volume_change_pct: volume_change,
            txn_count_change_pct: count_change,
            success_count: success_count.0.unwrap_or(0),
            failed_count: failed_count.0.unwrap_or(0),
            pending_count: pending_count.0.unwrap_or(0),
            revenue: revenue_row.0.unwrap_or(0.0),
            prev_revenue: prev_revenue_row.0.unwrap_or(0.0),
            has_api_keys: has_api_keys.0,
            has_webhooks: has_webhooks.0,
            has_transactions: has_transactions.0,
            kyb_status: kyb_row.0,
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

    let env = query.env.as_deref().unwrap_or("test");

    // Determine date range: custom from/to takes precedence over period
    let use_custom = query.from.is_some() && query.to.is_some();

    if use_custom {
        let from_str = query.from.as_deref().unwrap();
        let to_str = query.to.as_deref().unwrap();

        let rows: Vec<(String, Option<f64>, Option<i64>, Option<i64>, Option<i64>)> = sqlx::query_as(
            "SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD'), \
                    COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0), \
                    COUNT(*), \
                    COUNT(*) FILTER (WHERE status = 'success'), \
                    COUNT(*) FILTER (WHERE status = 'failed') \
             FROM transactions \
             WHERE business_id = $1 AND environment = $2 \
             AND created_at >= $3::timestamptz \
             AND created_at <= $4::timestamptz \
             GROUP BY created_at::date \
             ORDER BY created_at::date"
        )
        .bind(business_id)
        .bind(env)
        .bind(from_str)
        .bind(to_str)
        .fetch_all(pool.get_ref())
        .await?;

        let series: Vec<ChartPoint> = rows
            .into_iter()
            .map(|(date, volume, count, success, failed)| ChartPoint {
                date,
                volume: volume.unwrap_or(0.0),
                count: count.unwrap_or(0),
                success_count: success.unwrap_or(0),
                failed_count: failed.unwrap_or(0),
            })
            .collect();

        Ok(HttpResponse::Ok().json(ApiResponse::success(series, "Chart data retrieved")))
    } else {
        let days = match query.period.as_deref() {
            Some("7d") => 7,
            Some("30d") => 30,
            Some("90d") => 90,
            _ => 7,
        };

        let rows: Vec<(String, Option<f64>, Option<i64>, Option<i64>, Option<i64>)> = sqlx::query_as(
            "SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD'), \
                    COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0), \
                    COUNT(*), \
                    COUNT(*) FILTER (WHERE status = 'success'), \
                    COUNT(*) FILTER (WHERE status = 'failed') \
             FROM transactions \
             WHERE business_id = $1 AND environment = $2 \
             AND created_at >= NOW() - make_interval(days => $3) \
             GROUP BY created_at::date \
             ORDER BY created_at::date"
        )
        .bind(business_id)
        .bind(env)
        .bind(days)
        .fetch_all(pool.get_ref())
        .await?;

        let series: Vec<ChartPoint> = rows
            .into_iter()
            .map(|(date, volume, count, success, failed)| ChartPoint {
                date,
                volume: volume.unwrap_or(0.0),
                count: count.unwrap_or(0),
                success_count: success.unwrap_or(0),
                failed_count: failed.unwrap_or(0),
            })
            .collect();

        Ok(HttpResponse::Ok().json(ApiResponse::success(series, "Chart data retrieved")))
    }
}
