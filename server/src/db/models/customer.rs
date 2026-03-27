use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Customer {
    pub id: Uuid,
    pub business_id: Uuid,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub name: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct CustomerResponse {
    pub id: Uuid,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub name: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub transaction_count: Option<i64>,
    pub total_volume: Option<f64>,
    pub created_at: DateTime<Utc>,
}

impl From<Customer> for CustomerResponse {
    fn from(c: Customer) -> Self {
        Self {
            id: c.id,
            email: c.email,
            phone: c.phone,
            name: c.name,
            metadata: c.metadata,
            transaction_count: None,
            total_volume: None,
            created_at: c.created_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomerRequest {
    pub email: Option<String>,
    pub phone: Option<String>,
    pub name: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCustomerRequest {
    pub email: Option<String>,
    pub phone: Option<String>,
    pub name: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct CustomerQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub search: Option<String>,
}

impl CustomerQuery {
    pub fn limit(&self) -> i64 {
        self.limit.unwrap_or(50).min(100)
    }
    pub fn offset(&self) -> i64 {
        self.offset.unwrap_or(0)
    }
}
