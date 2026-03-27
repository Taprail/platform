use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct NotificationPreference {
    pub id: Uuid,
    pub business_id: Uuid,
    pub member_id: Uuid,
    pub email_payment_success: bool,
    pub email_payment_failed: bool,
    pub email_refund: bool,
    pub email_dispute: bool,
    pub email_settlement: bool,
    pub email_kyb_update: bool,
    pub email_weekly_summary: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNotificationPreferences {
    pub email_payment_success: Option<bool>,
    pub email_payment_failed: Option<bool>,
    pub email_refund: Option<bool>,
    pub email_dispute: Option<bool>,
    pub email_settlement: Option<bool>,
    pub email_kyb_update: Option<bool>,
    pub email_weekly_summary: Option<bool>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct EmailLog {
    pub id: Uuid,
    pub business_id: Uuid,
    pub recipient: String,
    pub template: String,
    pub subject: String,
    pub status: String,
    pub error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub sent_at: Option<DateTime<Utc>>,
}
