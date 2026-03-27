use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Refund {
    pub id: Uuid,
    pub business_id: Uuid,
    pub transaction_id: Uuid,
    pub amount: f64,
    pub currency: String,
    pub reason: Option<String>,
    pub status: String,
    pub provider_reference: Option<String>,
    pub idempotency_key: Option<String>,
    pub environment: String,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct RefundResponse {
    pub id: Uuid,
    pub transaction_id: Uuid,
    pub amount: f64,
    pub currency: String,
    pub reason: Option<String>,
    pub status: String,
    pub provider_reference: Option<String>,
    pub idempotency_key: Option<String>,
    pub environment: String,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

impl From<Refund> for RefundResponse {
    fn from(r: Refund) -> Self {
        Self {
            id: r.id,
            transaction_id: r.transaction_id,
            amount: r.amount,
            currency: r.currency,
            reason: r.reason,
            status: r.status,
            provider_reference: r.provider_reference,
            idempotency_key: r.idempotency_key,
            environment: r.environment,
            created_at: r.created_at,
            completed_at: r.completed_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateRefundRequest {
    pub transaction_id: Uuid,
    pub amount: Option<f64>,
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RefundQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub status: Option<String>,
    pub environment: Option<String>,
}

impl RefundQuery {
    pub fn limit(&self) -> i64 {
        self.limit.unwrap_or(50).min(100)
    }
    pub fn offset(&self) -> i64 {
        self.offset.unwrap_or(0)
    }
}
