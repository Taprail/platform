use actix_web::HttpRequest;
use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::errors::ApiError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardClaims {
    pub sub: String,
    pub business_id: String,
    pub email: String,
    pub role: String,
    pub exp: usize,
}

pub fn generate_dashboard_token(
    member_id: Uuid,
    business_id: Uuid,
    email: &str,
    role: &str,
    secret: &str,
) -> String {
    let claims = DashboardClaims {
        sub: member_id.to_string(),
        business_id: business_id.to_string(),
        email: email.to_string(),
        role: role.to_string(),
        exp: (Utc::now() + chrono::Duration::days(7)).timestamp() as usize,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .unwrap_or_default()
}

pub fn extract_dashboard_claims(
    req: &HttpRequest,
    jwt_secret: &str,
) -> Result<DashboardClaims, ApiError> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| ApiError::Unauthorized("Missing authorization header".into()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| ApiError::Unauthorized("Invalid authorization format".into()))?;

    let token_data = decode::<DashboardClaims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| ApiError::Unauthorized("Invalid or expired token".into()))?;

    Ok(token_data.claims)
}
