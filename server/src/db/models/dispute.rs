use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Dispute {
    pub id: Uuid,
    pub business_id: Uuid,
    pub transaction_id: Uuid,
    pub amount: f64,
    pub currency: String,
    pub reason: String,
    pub status: String,
    pub provider_dispute_id: Option<String>,
    pub evidence: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub environment: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct DisputeResponse {
    pub id: Uuid,
    pub transaction_id: Uuid,
    pub amount: f64,
    pub currency: String,
    pub reason: String,
    pub status: String,
    pub provider_dispute_id: Option<String>,
    pub evidence: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub environment: String,
    pub created_at: DateTime<Utc>,
}

impl From<Dispute> for DisputeResponse {
    fn from(d: Dispute) -> Self {
        Self {
            id: d.id,
            transaction_id: d.transaction_id,
            amount: d.amount,
            currency: d.currency,
            reason: d.reason,
            status: d.status,
            provider_dispute_id: d.provider_dispute_id,
            evidence: d.evidence,
            due_date: d.due_date,
            resolved_at: d.resolved_at,
            environment: d.environment,
            created_at: d.created_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateDisputeRequest {
    pub evidence: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DisputeQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub status: Option<String>,
}

impl DisputeQuery {
    pub fn limit(&self) -> i64 {
        self.limit.unwrap_or(50).min(100)
    }
    pub fn offset(&self) -> i64 {
        self.offset.unwrap_or(0)
    }
}
