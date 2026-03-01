use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Business {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub tier: String,
    pub fee_percent: f64,
    pub fee_cap: f64,
    pub webhook_secret: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct BusinessResponse {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub tier: String,
    pub fee_percent: f64,
    pub fee_cap: f64,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

impl From<Business> for BusinessResponse {
    fn from(b: Business) -> Self {
        Self {
            id: b.id,
            name: b.name,
            email: b.email,
            phone: b.phone,
            tier: b.tier,
            fee_percent: b.fee_percent,
            fee_cap: b.fee_cap,
            status: b.status,
            created_at: b.created_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub business_name: String,
    pub email: String,
    pub password: String,
    pub tier: String,
    pub phone: Option<String>,
    pub user_name: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub business: BusinessResponse,
    pub user: TeamMemberResponse,
}

use super::team::TeamMemberResponse;

#[derive(Debug, Deserialize)]
pub struct UpdateBusinessRequest {
    pub name: Option<String>,
    pub phone: Option<String>,
}
