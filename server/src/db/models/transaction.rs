use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub business_id: Uuid,
    pub session_id: Option<Uuid>,
    pub amount: f64,
    pub fee: f64,
    pub net_amount: f64,
    pub currency: String,
    pub status: String,
    pub payment_reference: Option<String>,
    pub merchant_ref: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct TransactionResponse {
    pub id: Uuid,
    pub session_id: Option<Uuid>,
    pub amount: f64,
    pub fee: f64,
    pub net_amount: f64,
    pub currency: String,
    pub status: String,
    pub payment_reference: Option<String>,
    pub merchant_ref: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

impl From<Transaction> for TransactionResponse {
    fn from(t: Transaction) -> Self {
        Self {
            id: t.id,
            session_id: t.session_id,
            amount: t.amount,
            fee: t.fee,
            net_amount: t.net_amount,
            currency: t.currency,
            status: t.status,
            payment_reference: t.payment_reference,
            merchant_ref: t.merchant_ref,
            metadata: t.metadata,
            created_at: t.created_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct TransactionQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub status: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
}

impl TransactionQuery {
    pub fn limit(&self) -> i64 {
        self.limit.unwrap_or(50).min(100)
    }
    pub fn offset(&self) -> i64 {
        self.offset.unwrap_or(0)
    }
}
