use actix_web::{web, HttpRequest, HttpResponse};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2, PasswordHash, PasswordVerifier,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, AuthResponse, BusinessResponse, LoginRequest, RegisterRequest, TeamMemberResponse};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::generate_dashboard_token;

pub async fn register(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    config: web::Data<crate::config::AppConfig>,
    body: web::Json<RegisterRequest>,
) -> Result<HttpResponse, ApiError> {
    if body.business_name.is_empty() || body.email.is_empty() || body.password.is_empty() {
        return Err(ApiError::BadRequest("All fields are required".into()));
    }

    if body.password.len() < 8 {
        return Err(ApiError::BadRequest("Password must be at least 8 characters".into()));
    }

    if !body.email.contains('@') || !body.email.contains('.') {
        return Err(ApiError::BadRequest("Invalid email format".into()));
    }

    if body.tier != "infra" && body.tier != "platform" {
        return Err(ApiError::BadRequest("Tier must be 'infra' or 'platform'".into()));
    }

    // Check if business email already exists
    let exists: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM businesses WHERE email = $1"
    )
    .bind(&body.email)
    .fetch_optional(pool.get_ref())
    .await?;

    if exists.is_some() {
        return Err(ApiError::BadRequest("Email already registered".into()));
    }

    // Generate webhook secret
    let webhook_secret: String = (0..32)
        .map(|_| format!("{:02x}", rand::random::<u8>()))
        .collect();

    // Create business
    let business_id = Uuid::new_v4();
    let now = chrono::Utc::now();

    sqlx::query(
        "INSERT INTO businesses (id, name, email, phone, tier, fee_percent, fee_cap, webhook_secret, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
    )
    .bind(business_id)
    .bind(&body.business_name)
    .bind(&body.email)
    .bind(&body.phone)
    .bind(&body.tier)
    .bind(config.default_fee_percent)
    .bind(config.default_fee_cap)
    .bind(&webhook_secret)
    .bind(now)
    .bind(now)
    .execute(pool.get_ref())
    .await?;

    // Hash password
    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(body.password.as_bytes(), &salt)
        .map_err(|e| ApiError::Internal(format!("Password hash error: {}", e)))?
        .to_string();

    // Create owner team member
    let member_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO team_members (id, business_id, email, name, password_hash, role, created_at) \
         VALUES ($1, $2, $3, $4, $5, 'owner', $6)"
    )
    .bind(member_id)
    .bind(business_id)
    .bind(&body.email)
    .bind(&body.user_name)
    .bind(&password_hash)
    .bind(now)
    .execute(pool.get_ref())
    .await?;

    let token = generate_dashboard_token(member_id, business_id, &body.email, "owner", &jwt_secret);

    crate::handlers::audit::log_audit(
        pool.get_ref(), business_id, Some(member_id), Some(&body.email),
        "register", "business", Some(&business_id.to_string()),
        Some(serde_json::json!({"business_name": &body.business_name})),
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        AuthResponse {
            token,
            business: BusinessResponse {
                id: business_id,
                name: body.business_name.clone(),
                email: body.email.clone(),
                phone: body.phone.clone(),
                tier: body.tier.clone(),
                fee_percent: config.default_fee_percent,
                fee_cap: config.default_fee_cap,
                status: "active".to_string(),
                kyb_status: "not_started".to_string(),
                created_at: now,
            },
            user: TeamMemberResponse {
                id: member_id,
                email: body.email.clone(),
                name: body.user_name.clone(),
                role: "owner".to_string(),
                is_active: true,
                created_at: now,
                last_login_at: None,
            },
        },
        "Business registered successfully",
    )))
}

pub async fn login(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<LoginRequest>,
) -> Result<HttpResponse, ApiError> {
    // Find team member by email
    let members: Vec<crate::db::TeamMember> = sqlx::query_as(
        "SELECT id, business_id, email, name, password_hash, role, is_active, created_at, last_login_at \
         FROM team_members WHERE email = $1 AND is_active = TRUE"
    )
    .bind(&body.email)
    .fetch_all(pool.get_ref())
    .await?;

    if members.is_empty() {
        return Err(ApiError::Unauthorized("Invalid credentials".into()));
    }
    if members.len() > 1 {
        return Err(ApiError::BadRequest(
            "This email is associated with multiple businesses. Please contact support.".into()
        ));
    }
    let member = members.into_iter().next().unwrap();

    // Verify password
    let parsed_hash = PasswordHash::new(&member.password_hash)
        .map_err(|_| ApiError::Internal("Password verification error".into()))?;

    Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed_hash)
        .map_err(|_| ApiError::Unauthorized("Invalid credentials".into()))?;

    // Update last_login_at
    let _ = sqlx::query("UPDATE team_members SET last_login_at = NOW() WHERE id = $1")
        .bind(member.id)
        .execute(pool.get_ref())
        .await;

    // Fetch business
    let business: crate::db::Business = sqlx::query_as(
        "SELECT * FROM businesses WHERE id = $1"
    )
    .bind(member.business_id)
    .fetch_one(pool.get_ref())
    .await?;

    let token = generate_dashboard_token(
        member.id, member.business_id, &member.email, &member.role, &jwt_secret,
    );

    crate::handlers::audit::log_audit(
        pool.get_ref(), member.business_id, Some(member.id), Some(&member.email),
        "login", "session", None, None,
        crate::handlers::audit::get_ip(&req).as_deref(),
    ).await;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        AuthResponse {
            token,
            business: business.into(),
            user: member.into(),
        },
        "Login successful",
    )))
}
