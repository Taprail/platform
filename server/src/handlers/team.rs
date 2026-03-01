use actix_web::{web, HttpRequest, HttpResponse};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, InviteTeamMemberRequest, TeamMemberResponse, UpdateTeamMemberRequest};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

pub async fn list_team(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let members: Vec<crate::db::TeamMember> = sqlx::query_as(
        "SELECT * FROM team_members WHERE business_id = $1 ORDER BY created_at"
    )
    .bind(business_id)
    .fetch_all(pool.get_ref())
    .await?;

    let members: Vec<TeamMemberResponse> = members.into_iter().map(Into::into).collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(members, "Team members retrieved")))
}

pub async fn invite_member(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<InviteTeamMemberRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    if claims.role != "owner" && claims.role != "admin" {
        return Err(ApiError::Forbidden("Only owners and admins can invite members".into()));
    }

    let valid_roles = ["admin", "member", "viewer"];
    if !valid_roles.contains(&body.role.as_str()) {
        return Err(ApiError::BadRequest("Invalid role".into()));
    }

    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(body.password.as_bytes(), &salt)
        .map_err(|e| ApiError::Internal(format!("Password hash error: {}", e)))?
        .to_string();

    let member_id = Uuid::new_v4();
    let now = chrono::Utc::now();

    sqlx::query(
        "INSERT INTO team_members (id, business_id, email, name, password_hash, role, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7)"
    )
    .bind(member_id)
    .bind(business_id)
    .bind(&body.email)
    .bind(&body.name)
    .bind(&password_hash)
    .bind(&body.role)
    .bind(now)
    .execute(pool.get_ref())
    .await?;

    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, None, Some(&claims.email),
        "invite", "team_member", Some(&member_id.to_string()),
        Some(serde_json::json!({"email": &body.email, "role": &body.role})),
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        TeamMemberResponse {
            id: member_id,
            email: body.email.clone(),
            name: body.name.clone(),
            role: body.role.clone(),
            is_active: true,
            created_at: now,
            last_login_at: None,
        },
        "Team member invited",
    )))
}

pub async fn update_member(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateTeamMemberRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let member_id = path.into_inner();

    if claims.role != "owner" && claims.role != "admin" {
        return Err(ApiError::Forbidden("Insufficient permissions".into()));
    }

    if let Some(ref role) = body.role {
        sqlx::query("UPDATE team_members SET role = $1 WHERE id = $2 AND business_id = $3")
            .bind(role)
            .bind(member_id)
            .bind(business_id)
            .execute(pool.get_ref())
            .await?;
    }

    if let Some(is_active) = body.is_active {
        sqlx::query("UPDATE team_members SET is_active = $1 WHERE id = $2 AND business_id = $3")
            .bind(is_active)
            .bind(member_id)
            .bind(business_id)
            .execute(pool.get_ref())
            .await?;
    }

    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, None, Some(&claims.email),
        "update", "team_member", Some(&member_id.to_string()),
        Some(serde_json::json!({"role": &body.role, "is_active": &body.is_active})),
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::<()>::success((), "Team member updated")))
}

pub async fn remove_member(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let member_id = path.into_inner();

    if claims.role != "owner" {
        return Err(ApiError::Forbidden("Only owners can remove members".into()));
    }

    // Prevent removing self
    let self_id: Uuid = claims.sub.parse()
        .map_err(|_| ApiError::Internal("Invalid member ID".into()))?;
    if member_id == self_id {
        return Err(ApiError::BadRequest("Cannot remove yourself".into()));
    }

    sqlx::query("DELETE FROM team_members WHERE id = $1 AND business_id = $2 AND role != 'owner'")
        .bind(member_id)
        .bind(business_id)
        .execute(pool.get_ref())
        .await?;

    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, None, Some(&claims.email),
        "remove", "team_member", Some(&member_id.to_string()),
        None,
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::<()>::success((), "Team member removed")))
}
