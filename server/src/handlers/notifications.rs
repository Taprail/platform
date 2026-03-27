use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, EmailLog, NotificationPreference, PaginationParams};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

#[derive(Debug, serde::Deserialize)]
pub struct UpdatePreferencesRequest {
    pub email_payment_success: Option<bool>,
    pub email_payment_failed: Option<bool>,
    pub email_refund: Option<bool>,
    pub email_dispute: Option<bool>,
    pub email_settlement: Option<bool>,
    pub email_kyb_update: Option<bool>,
    pub email_weekly_summary: Option<bool>,
}

async fn resolve_member_id(
    pool: &PgPool,
    business_id: Uuid,
    email: &str,
) -> Result<Uuid, ApiError> {
    let row: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM team_members WHERE business_id = $1 AND email = $2",
    )
    .bind(business_id)
    .bind(email)
    .fetch_optional(pool)
    .await?;

    row.map(|r| r.0)
        .ok_or_else(|| ApiError::NotFound("Team member not found".into()))
}

pub async fn get_preferences(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let member_id = resolve_member_id(pool.get_ref(), business_id, &claims.email).await?;

    let prefs: Option<NotificationPreference> = sqlx::query_as(
        "SELECT * FROM notification_preferences WHERE business_id = $1 AND member_id = $2",
    )
    .bind(business_id)
    .bind(member_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let prefs = match prefs {
        Some(p) => p,
        None => {
            // Create default preferences
            let pref_id = Uuid::new_v4();
            sqlx::query(
                "INSERT INTO notification_preferences \
                 (id, business_id, member_id, email_payment_success, email_payment_failed, \
                  email_refund, email_dispute, email_settlement, email_kyb_update, email_weekly_summary) \
                 VALUES ($1, $2, $3, true, true, true, true, true, true, true)",
            )
            .bind(pref_id)
            .bind(business_id)
            .bind(member_id)
            .execute(pool.get_ref())
            .await?;

            sqlx::query_as("SELECT * FROM notification_preferences WHERE id = $1")
                .bind(pref_id)
                .fetch_one(pool.get_ref())
                .await?
        }
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(prefs, "Notification preferences retrieved")))
}

pub async fn update_preferences(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<UpdatePreferencesRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let member_id = resolve_member_id(pool.get_ref(), business_id, &claims.email).await?;

    sqlx::query(
        "INSERT INTO notification_preferences \
         (id, business_id, member_id, email_payment_success, email_payment_failed, \
          email_refund, email_dispute, email_settlement, email_kyb_update, email_weekly_summary) \
         VALUES ($1, $2, $3, \
                 COALESCE($4, true), COALESCE($5, true), COALESCE($6, true), \
                 COALESCE($7, true), COALESCE($8, true), COALESCE($9, true), COALESCE($10, true)) \
         ON CONFLICT (business_id, member_id) DO UPDATE SET \
           email_payment_success = COALESCE($4, notification_preferences.email_payment_success), \
           email_payment_failed = COALESCE($5, notification_preferences.email_payment_failed), \
           email_refund = COALESCE($6, notification_preferences.email_refund), \
           email_dispute = COALESCE($7, notification_preferences.email_dispute), \
           email_settlement = COALESCE($8, notification_preferences.email_settlement), \
           email_kyb_update = COALESCE($9, notification_preferences.email_kyb_update), \
           email_weekly_summary = COALESCE($10, notification_preferences.email_weekly_summary)",
    )
    .bind(Uuid::new_v4())
    .bind(business_id)
    .bind(member_id)
    .bind(body.email_payment_success)
    .bind(body.email_payment_failed)
    .bind(body.email_refund)
    .bind(body.email_dispute)
    .bind(body.email_settlement)
    .bind(body.email_kyb_update)
    .bind(body.email_weekly_summary)
    .execute(pool.get_ref())
    .await?;

    // Fetch and return updated preferences
    let prefs: NotificationPreference = sqlx::query_as(
        "SELECT * FROM notification_preferences WHERE business_id = $1 AND member_id = $2",
    )
    .bind(business_id)
    .bind(member_id)
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(prefs, "Notification preferences updated")))
}

pub async fn list_email_logs(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<PaginationParams>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let logs: Vec<EmailLog> = sqlx::query_as(
        "SELECT * FROM email_logs WHERE business_id = $1 \
         ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    )
    .bind(business_id)
    .bind(query.limit())
    .bind(query.offset())
    .fetch_all(pool.get_ref())
    .await?;

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM email_logs WHERE business_id = $1",
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": logs,
        "message": "Email logs retrieved",
        "total": total.0
    })))
}
