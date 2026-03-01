use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

pub mod session_status {
    pub const PENDING: &str = "pending";
    pub const LOCKED: &str = "locked";
    pub const PAID: &str = "paid";
    pub const EXPIRED: &str = "expired";
    pub const CANCELLED: &str = "cancelled";
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PaymentSession {
    pub id: Uuid,
    pub business_id: Uuid,
    pub merchant_ref: Option<String>,
    pub amount: f64,
    pub currency: String,
    pub nonce: String,
    pub status: String,
    pub signature: String,
    pub metadata: Option<serde_json::Value>,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct SessionResponse {
    pub id: Uuid,
    pub merchant_ref: Option<String>,
    pub amount: f64,
    pub currency: String,
    pub nonce: String,
    pub status: String,
    pub signature: String,
    pub metadata: Option<serde_json::Value>,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

impl From<PaymentSession> for SessionResponse {
    fn from(s: PaymentSession) -> Self {
        Self {
            id: s.id,
            merchant_ref: s.merchant_ref,
            amount: s.amount,
            currency: s.currency,
            nonce: s.nonce,
            status: s.status,
            signature: s.signature,
            metadata: s.metadata,
            expires_at: s.expires_at,
            created_at: s.created_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateSessionRequest {
    pub amount: f64,
    pub merchant_ref: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct VerifySessionRequest {
    pub nonce: String,
    pub signature: String,
}

#[derive(Debug, Deserialize)]
pub struct ChargeSessionRequest {
    pub payment_token: String,
    pub email: String,
}
