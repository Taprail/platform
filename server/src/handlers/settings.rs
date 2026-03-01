use actix_web::{web, HttpRequest, HttpResponse};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2, PasswordHash, PasswordVerifier,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, BusinessResponse, UpdateBusinessRequest};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

pub async fn get_settings(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let business: crate::db::Business = sqlx::query_as(
        "SELECT * FROM businesses WHERE id = $1"
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    // Mask webhook secret: show first 8 and last 4 chars
    let masked_secret = if business.webhook_secret.len() > 12 {
        let prefix = &business.webhook_secret[..8];
        let suffix = &business.webhook_secret[business.webhook_secret.len() - 4..];
        format!("{}...{}", prefix, suffix)
    } else {
        "********".to_string()
    };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {
            "business": BusinessResponse::from(business),
            "webhook_secret": masked_secret,
        },
        "message": "Settings retrieved"
    })))
}

pub async fn update_settings(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<UpdateBusinessRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    // Only owner or admin can update settings
    if claims.role != "owner" && claims.role != "admin" {
        return Err(ApiError::Forbidden("Only owner or admin can update settings".into()));
    }

    let member_id: Uuid = claims.sub.parse()
        .map_err(|_| ApiError::Internal("Invalid member ID".into()))?;

    // Build update query dynamically
    let mut updates = Vec::new();
    let mut param_idx = 2u32; // $1 is business_id

    if let Some(ref name) = body.name {
        if name.trim().len() < 2 {
            return Err(ApiError::BadRequest("Business name is too short".into()));
        }
        updates.push(format!("name = ${}", param_idx));
        param_idx += 1;
    }
    if body.phone.is_some() {
        updates.push(format!("phone = ${}", param_idx));
        param_idx += 1;
    }

    if updates.is_empty() {
        return Err(ApiError::BadRequest("No fields to update".into()));
    }

    updates.push(format!("updated_at = ${}", param_idx));

    let sql = format!(
        "UPDATE businesses SET {} WHERE id = $1 RETURNING *",
        updates.join(", ")
    );

    let mut query = sqlx::query_as::<_, crate::db::Business>(&sql).bind(business_id);
    if let Some(ref name) = body.name {
        query = query.bind(name.trim());
    }
    if let Some(ref phone) = body.phone {
        query = query.bind(phone);
    }
    query = query.bind(chrono::Utc::now());

    let business = query.fetch_one(pool.get_ref()).await?;

    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, Some(member_id), Some(&claims.email),
        "update", "business_settings", Some(&business_id.to_string()),
        Some(serde_json::json!({"name": &body.name, "phone": &body.phone})),
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        BusinessResponse::from(business),
        "Settings updated",
    )))
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

pub async fn change_password(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<ChangePasswordRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let member_id: Uuid = claims.sub.parse()
        .map_err(|_| ApiError::Internal("Invalid member ID".into()))?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    if body.new_password.len() < 8 {
        return Err(ApiError::BadRequest("New password must be at least 8 characters".into()));
    }

    // Fetch current password hash
    let member: crate::db::TeamMember = sqlx::query_as(
        "SELECT id, business_id, email, name, password_hash, role, is_active, created_at, last_login_at \
         FROM team_members WHERE id = $1 AND business_id = $2"
    )
    .bind(member_id)
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| ApiError::NotFound("Member not found".into()))?;

    // Verify current password
    let parsed_hash = PasswordHash::new(&member.password_hash)
        .map_err(|_| ApiError::Internal("Password verification error".into()))?;

    Argon2::default()
        .verify_password(body.current_password.as_bytes(), &parsed_hash)
        .map_err(|_| ApiError::BadRequest("Current password is incorrect".into()))?;

    // Hash new password
    let salt = SaltString::generate(&mut OsRng);
    let new_hash = Argon2::default()
        .hash_password(body.new_password.as_bytes(), &salt)
        .map_err(|e| ApiError::Internal(format!("Password hash error: {}", e)))?
        .to_string();

    sqlx::query("UPDATE team_members SET password_hash = $1 WHERE id = $2")
        .bind(&new_hash)
        .bind(member_id)
        .execute(pool.get_ref())
        .await?;

    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, Some(member_id), Some(&claims.email),
        "change_password", "team_member", Some(&member_id.to_string()),
        None,
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": null,
        "message": "Password changed successfully"
    })))
}
