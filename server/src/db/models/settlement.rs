use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Settlement {
    pub id: Uuid,
    pub business_id: Uuid,
    pub amount: f64,
    pub fee_total: f64,
    pub net_amount: f64,
    pub currency: String,
    pub status: String,
    pub bank_name: Option<String>,
    pub account_number: Option<String>,
    pub account_name: Option<String>,
    pub reference: Option<String>,
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub transaction_count: i32,
    pub environment: String,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct SettlementResponse {
    pub id: Uuid,
    pub amount: f64,
    pub fee_total: f64,
    pub net_amount: f64,
    pub currency: String,
    pub status: String,
    pub bank_name: Option<String>,
    pub account_number: Option<String>,
    pub account_name: Option<String>,
    pub reference: Option<String>,
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub transaction_count: i32,
    pub environment: String,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

impl From<Settlement> for SettlementResponse {
    fn from(s: Settlement) -> Self {
        Self {
            id: s.id,
            amount: s.amount,
            fee_total: s.fee_total,
            net_amount: s.net_amount,
            currency: s.currency,
            status: s.status,
            bank_name: s.bank_name,
            account_number: s.account_number,
            account_name: s.account_name,
            reference: s.reference,
            period_start: s.period_start,
            period_end: s.period_end,
            transaction_count: s.transaction_count,
            environment: s.environment,
            created_at: s.created_at,
            completed_at: s.completed_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct SettlementQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub status: Option<String>,
    pub environment: Option<String>,
}

impl SettlementQuery {
    pub fn limit(&self) -> i64 {
        self.limit.unwrap_or(50).min(100)
    }
    pub fn offset(&self) -> i64 {
        self.offset.unwrap_or(0)
    }
}
