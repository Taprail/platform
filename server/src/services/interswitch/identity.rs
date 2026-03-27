use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::auth::InterswitchAuth;

/// Interswitch Identity/KYC verification service.
/// Uses `POST /api/v1/verifications` to verify BVN, NIN, address, AML, etc.
pub struct InterswitchIdentityService {
    client: Client,
    base_url: String,
    auth: InterswitchAuth,
}

impl InterswitchIdentityService {
    pub fn new(base_url: String, auth: InterswitchAuth) -> Self {
        Self {
            client: Client::new(),
            base_url,
            auth,
        }
    }

    /// Run one or more verification checks in a single call.
    pub async fn verify(
        &self,
        request: &VerificationRequest,
    ) -> Result<VerificationResponse, String> {
        let token = self.auth.get_token().await?;

        let url = format!("{}/api/v1/verifications", self.base_url);
        let request_body = serde_json::to_string(request).unwrap_or_default();
        log::info!("ISW identity request: POST {} body={}", url, request_body);

        let resp = self
            .client
            .post(&url)
            .bearer_auth(&token)
            .json(request)
            .send()
            .await
            .map_err(|e| format!("ISW identity request failed: {}", e))?;

        let status = resp.status();
        let body = resp
            .text()
            .await
            .map_err(|e| format!("Failed to read ISW identity response: {}", e))?;

        log::info!("ISW identity response ({}): {}", status, body);

        if status.is_success() || status.as_u16() == 400 {
            // ISW returns 200 for success and sometimes 400 with verification results
            serde_json::from_str::<VerificationResponse>(&body)
                .map_err(|e| format!("Failed to parse ISW identity response: {} — body: {}", e, body))
        } else {
            Err(format!("ISW identity verification failed ({}): {}", status, body))
        }
    }

    /// Verify a BVN number against the director's personal info.
    pub async fn verify_bvn(
        &self,
        bvn: &str,
        first_name: &str,
        last_name: &str,
        phone: &str,
        date_of_birth: &str,
    ) -> Result<VerificationResponse, String> {
        let request = VerificationRequest {
            r#type: "INDIVIDUAL".to_string(),
            first_name: Some(first_name.to_string()),
            last_name: Some(last_name.to_string()),
            phone: Some(phone.to_string()),
            birth_date: Some(date_of_birth.to_string()),
            gender: None,
            kyc_domain: None,
            callback_url: None,
            verification_requests: vec![VerificationCheck {
                r#type: "BVN".to_string(),
                identity_number: Some(bvn.to_string()),
                country: None,
                kyc_domain: None,
                gender: None,
                documents: None,
                address: None,
            }],
        };

        self.verify(&request).await
    }

    /// Verify a BVN + run AML domestic check in a single call.
    pub async fn verify_bvn_and_aml(
        &self,
        bvn: &str,
        first_name: &str,
        last_name: &str,
        phone: &str,
        date_of_birth: &str,
        country_alpha3: &str,
        callback_url: &str,
    ) -> Result<VerificationResponse, String> {
        let request = VerificationRequest {
            r#type: "INDIVIDUAL".to_string(),
            first_name: Some(first_name.to_string()),
            last_name: Some(last_name.to_string()),
            phone: Some(phone.to_string()),
            birth_date: Some(date_of_birth.to_string()),
            gender: Some("M".to_string()),
            kyc_domain: Some("DOMESTIC".to_string()),
            callback_url: Some(callback_url.to_string()),
            verification_requests: vec![
                VerificationCheck {
                    r#type: "BVN".to_string(),
                    identity_number: Some(bvn.to_string()),
                    country: None,
                    kyc_domain: None,
                    gender: None,
                    documents: None,
                    address: None,
                },
                VerificationCheck {
                    r#type: "AML".to_string(),
                    identity_number: None,
                    country: Some(country_alpha3.to_string()),
                    kyc_domain: None,
                    gender: None,
                    documents: None,
                    address: None,
                },
            ],
        };

        self.verify(&request).await
    }
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct VerificationRequest {
    pub r#type: String,
    #[serde(rename = "firstName", skip_serializing_if = "Option::is_none")]
    pub first_name: Option<String>,
    #[serde(rename = "lastName", skip_serializing_if = "Option::is_none")]
    pub last_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(rename = "birthDate", skip_serializing_if = "Option::is_none")]
    pub birth_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gender: Option<String>,
    #[serde(rename = "kycDomain", skip_serializing_if = "Option::is_none")]
    pub kyc_domain: Option<String>,
    #[serde(rename = "callbackUrl", skip_serializing_if = "Option::is_none")]
    pub callback_url: Option<String>,
    #[serde(rename = "verificationRequests")]
    pub verification_requests: Vec<VerificationCheck>,
}

#[derive(Debug, Serialize)]
pub struct VerificationCheck {
    pub r#type: String,
    #[serde(rename = "identityNumber", skip_serializing_if = "Option::is_none")]
    pub identity_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub country: Option<String>,
    #[serde(rename = "kycDomain", skip_serializing_if = "Option::is_none")]
    pub kyc_domain: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gender: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub documents: Option<Vec<VerificationDocument>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub address: Option<VerificationAddress>,
}

#[derive(Debug, Serialize)]
pub struct VerificationDocument {
    #[serde(rename = "fileName")]
    pub file_name: String,
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct VerificationAddress {
    #[serde(rename = "buildingNumber", skip_serializing_if = "Option::is_none")]
    pub building_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub street: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub landmark: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub city: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub country: Option<String>,
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct VerificationResponse {
    #[serde(rename = "verificationResponses", default)]
    pub verification_responses: Vec<VerificationResult>,
    /// Error fields (ISW returns these on validation failures)
    #[serde(rename = "failureCode", default)]
    pub failure_code: Option<String>,
    #[serde(rename = "failureDescription", default)]
    pub failure_description: Option<String>,
}

impl VerificationResponse {
    pub fn all_verified(&self) -> bool {
        !self.verification_responses.is_empty()
            && self
                .verification_responses
                .iter()
                .all(|r| r.status == "VERIFIED" || r.status == "MATCH")
    }

    pub fn bvn_result(&self) -> Option<&VerificationResult> {
        self.verification_responses
            .iter()
            .find(|r| r.r#type == "BVN")
    }

    pub fn aml_result(&self) -> Option<&VerificationResult> {
        self.verification_responses
            .iter()
            .find(|r| r.r#type == "AML")
    }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct VerificationResult {
    pub r#type: String,
    pub status: String,
    #[serde(rename = "identityNumber", default)]
    pub identity_number: Option<String>,
    #[serde(default)]
    pub reference: Option<String>,
    #[serde(rename = "failureCode", default)]
    pub failure_code: Option<String>,
    #[serde(rename = "failureDescription", default)]
    pub failure_description: Option<String>,
}
