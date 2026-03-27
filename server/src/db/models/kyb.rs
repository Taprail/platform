use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct KybSubmission {
    pub id: Uuid,
    pub business_id: Uuid,
    pub status: String,
    pub registered_name: Option<String>,
    pub registration_number: Option<String>,
    pub business_type: Option<String>,
    pub business_address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub date_of_incorporation: Option<String>,
    pub industry: Option<String>,
    pub website: Option<String>,
    pub description: Option<String>,
    pub director_full_name: Option<String>,
    pub director_email: Option<String>,
    pub director_phone: Option<String>,
    pub director_bvn: Option<String>,
    pub director_dob: Option<String>,
    pub director_address: Option<String>,
    pub director_nationality: Option<String>,
    pub submitted_at: Option<DateTime<Utc>>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub reviewed_by: Option<Uuid>,
    pub rejection_reason: Option<String>,
    pub bvn_verified: Option<bool>,
    pub bvn_verification_ref: Option<String>,
    pub bvn_failure_reason: Option<String>,
    pub aml_status: Option<String>,
    pub aml_failure_reason: Option<String>,
    pub verification_raw_response: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct KybDocument {
    pub id: Uuid,
    pub kyb_submission_id: Uuid,
    pub business_id: Uuid,
    pub document_type: String,
    pub file_name: String,
    pub file_url: String,
    pub file_size: Option<i32>,
    pub mime_type: Option<String>,
    pub status: String,
    pub rejection_reason: Option<String>,
    pub uploaded_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct KybStatusResponse {
    pub status: String,
    pub submission: Option<KybSubmission>,
    pub documents: Vec<KybDocument>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBusinessInfoRequest {
    pub registered_name: Option<String>,
    pub registration_number: Option<String>,
    pub business_type: Option<String>,
    pub business_address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub date_of_incorporation: Option<String>,
    pub industry: Option<String>,
    pub website: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDirectorInfoRequest {
    pub director_full_name: Option<String>,
    pub director_email: Option<String>,
    pub director_phone: Option<String>,
    pub director_bvn: Option<String>,
    pub director_dob: Option<String>,
    pub director_address: Option<String>,
    pub director_nationality: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UploadDocumentRequest {
    pub document_type: String,
    pub file_name: String,
    pub file_url: String,
    pub file_size: Option<i32>,
    pub mime_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReviewKybRequest {
    pub status: String,
    pub rejection_reason: Option<String>,
}
