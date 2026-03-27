use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

pub mod session_status {
    pub const PENDING: &str = "pending";
    pub const LOCKED: &str = "locked";
    pub const AWAITING_OTP: &str = "awaiting_otp";
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
    pub environment: String,
    pub provider_ref: Option<String>,
    pub payment_reference: Option<String>,
    pub encrypted_auth_data: Option<String>,
    pub otp_attempts: i32,
    pub computed_fee: Option<f64>,
    pub computed_net_amount: Option<f64>,
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

/// OTP submission for infra-tier sessions awaiting OTP validation.
#[derive(Debug, Deserialize)]
pub struct InfraOtpRequest {
    pub otp: String,
}

/// Request body for infra-tier session completion.
/// Card data is RSA-encrypted server-side before sending to Interswitch.
#[derive(Debug, Deserialize)]
pub struct InfraCompleteRequest {
    /// Customer identifier (email or phone).
    pub customer_id: String,
    /// Card PAN read from NFC.
    pub pan: String,
    /// Card PIN entered by customer.
    pub pin: String,
    /// Expiry date in YYMM format.
    pub expiry_date: String,
    /// CVV2/CVC2 (for CNP fallback; may be empty for NFC contactless).
    #[serde(default)]
    pub cvv: String,
}
