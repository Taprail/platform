use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct PassportTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
}

// ---------------------------------------------------------------------------
// Purchase (ISW v3 Card Payment API)
// ---------------------------------------------------------------------------

/// ISW v3 purchase request body.
/// authData = RSA-encrypted "1Z{pan}Z{pin}Z{expiryDate}Z{cvv}" (base64-encoded).
#[derive(Debug, Serialize)]
pub struct PurchaseRequest {
    #[serde(rename = "customerId")]
    pub customer_id: String,
    pub amount: String,
    #[serde(rename = "transactionRef")]
    pub transaction_ref: String,
    pub currency: String,
    #[serde(rename = "authData")]
    pub auth_data: String,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct PurchaseResponse {
    #[serde(rename = "responseCode")]
    pub response_code: Option<String>,
    pub message: Option<String>,
    #[serde(rename = "transactionRef")]
    pub transaction_ref: Option<String>,
    pub amount: Option<serde_json::Value>,
    #[serde(rename = "paymentId")]
    pub payment_id: Option<String>,
    /// Interswitch retrieval reference number.
    #[serde(rename = "retrievalReferenceNumber")]
    pub retrieval_reference_number: Option<String>,
    pub errors: Option<Vec<IswError>>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct IswError {
    pub code: Option<String>,
    pub message: Option<String>,
}

impl PurchaseResponse {
    pub fn is_approved(&self) -> bool {
        self.response_code.as_deref() == Some("00")
    }

    pub fn needs_otp(&self) -> bool {
        self.response_code.as_deref() == Some("T0")
    }

    pub fn error_message(&self) -> String {
        if let Some(ref errors) = self.errors {
            errors
                .iter()
                .filter_map(|e| e.message.as_deref())
                .collect::<Vec<_>>()
                .join("; ")
        } else {
            self.message.clone().unwrap_or_else(|| "Unknown error".to_string())
        }
    }
}

// ---------------------------------------------------------------------------
// OTP Validation
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct OtpRequest {
    #[serde(rename = "paymentId")]
    pub payment_id: String,
    #[serde(rename = "authData")]
    pub auth_data: String,
    pub otp: String,
}

// ---------------------------------------------------------------------------
// Transaction status query
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct TransactionStatusResponse {
    #[serde(rename = "responseCode")]
    pub response_code: Option<String>,
    pub message: Option<String>,
    pub amount: Option<i64>,
    #[serde(rename = "transactionRef")]
    pub transaction_ref: Option<String>,
}

#[allow(dead_code)]
impl TransactionStatusResponse {
    pub fn is_approved(&self) -> bool {
        self.response_code.as_deref() == Some("00")
    }
}
