use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ApiKey {
    pub id: Uuid,
    pub business_id: Uuid,
    pub label: String,
    pub key_prefix: String,
    pub key_hash: String,
    pub last4: String,
    pub environment: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct ApiKeyResponse {
    pub id: Uuid,
    pub label: String,
    pub key_prefix: String,
    pub last4: String,
    pub environment: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
}

impl From<ApiKey> for ApiKeyResponse {
    fn from(k: ApiKey) -> Self {
        Self {
            id: k.id,
            label: k.label,
            key_prefix: k.key_prefix,
            last4: k.last4,
            environment: k.environment,
            is_active: k.is_active,
            created_at: k.created_at,
            last_used_at: k.last_used_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ApiKeyCreatedResponse {
    pub test_key: String,
    pub live_key: String,
    pub test_key_id: Uuid,
    pub live_key_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct CreateApiKeyRequest {
    pub label: Option<String>,
}
