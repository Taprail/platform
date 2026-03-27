use reqwest::Client;

use super::auth::InterswitchAuth;
use super::crypto::encrypt_auth_data;
use super::types::{OtpRequest, PurchaseRequest, PurchaseResponse, TransactionStatusResponse};

/// Processes NFC/contactless payments through Interswitch's Card Payment v3 API.
#[allow(dead_code)]
pub struct InterswitchPaymentService {
    client: Client,
    base_url: String,
    auth: InterswitchAuth,
    merchant_code: String,
    pay_item_id: String,
    /// RSA modulus (hex) provided by Interswitch for authData encryption.
    rsa_modulus: String,
    /// RSA public exponent (hex), typically "010001" (65537).
    rsa_exponent: String,
}

impl InterswitchPaymentService {
    pub fn new(
        base_url: String,
        auth: InterswitchAuth,
        merchant_code: String,
        pay_item_id: String,
        rsa_modulus: String,
        rsa_exponent: String,
    ) -> Self {
        Self {
            client: Client::new(),
            base_url,
            auth,
            merchant_code,
            pay_item_id,
            rsa_modulus,
            rsa_exponent,
        }
    }

    /// Submit a card payment to Interswitch v3 API.
    ///
    /// Card data (PAN, PIN, expiry, CVV) is RSA-encrypted into authData on the server side.
    /// Returns (PurchaseResponse, auth_data) — auth_data is needed for OTP validation if T0.
    pub async fn purchase(
        &self,
        amount_kobo: i64,
        transaction_ref: &str,
        customer_id: &str,
        pan: &str,
        pin: &str,
        expiry_date: &str,
        cvv: &str,
    ) -> Result<(PurchaseResponse, String), String> {
        let token = self.auth.get_token().await?;

        let auth_data = encrypt_auth_data(
            pan,
            pin,
            expiry_date,
            cvv,
            &self.rsa_modulus,
            &self.rsa_exponent,
        )?;

        let body = PurchaseRequest {
            customer_id: customer_id.to_string(),
            amount: amount_kobo.to_string(),
            transaction_ref: transaction_ref.to_string(),
            currency: "NGN".to_string(),
            auth_data: auth_data.clone(),
        };

        let resp = self
            .client
            .post(format!("{}/api/v3/purchases", self.base_url))
            .bearer_auth(&token)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("ISW purchase request failed: {}", e))?;

        let status = resp.status();
        let resp_body = resp
            .text()
            .await
            .map_err(|e| format!("Failed to read ISW response: {}", e))?;

        log::info!("ISW purchase response ({}): {}", status, resp_body);

        // Try to parse as PurchaseResponse regardless of status code
        // ISW returns error details in the same JSON structure
        match serde_json::from_str::<PurchaseResponse>(&resp_body) {
            Ok(parsed) => {
                if parsed.is_approved() || parsed.needs_otp() {
                    Ok((parsed, auth_data))
                } else if parsed.errors.is_some() {
                    Err(format!(
                        "ISW purchase declined ({}): {}",
                        parsed.response_code.as_deref().unwrap_or("unknown"),
                        parsed.error_message()
                    ))
                } else {
                    Err(format!(
                        "ISW purchase declined ({}): {}",
                        parsed.response_code.as_deref().unwrap_or("unknown"),
                        parsed.message.as_deref().unwrap_or("Unknown error")
                    ))
                }
            }
            Err(_) => Err(format!("ISW purchase failed ({}): {}", status, resp_body)),
        }
    }

    /// Submit OTP for a transaction that returned response code T0.
    pub async fn validate_otp(
        &self,
        payment_id: &str,
        auth_data: &str,
        otp: &str,
    ) -> Result<PurchaseResponse, String> {
        let token = self.auth.get_token().await?;

        let body = OtpRequest {
            payment_id: payment_id.to_string(),
            auth_data: auth_data.to_string(),
            otp: otp.to_string(),
        };

        let resp = self
            .client
            .post(format!("{}/api/v3/purchases/otps/auths", self.base_url))
            .bearer_auth(&token)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("ISW OTP validation request failed: {}", e))?;

        let status = resp.status();
        let resp_body = resp
            .text()
            .await
            .map_err(|e| format!("Failed to read ISW OTP response: {}", e))?;

        log::info!("ISW OTP response ({}): {}", status, resp_body);

        match serde_json::from_str::<PurchaseResponse>(&resp_body) {
            Ok(parsed) => {
                if parsed.is_approved() {
                    Ok(parsed)
                } else if parsed.errors.is_some() {
                    Err(format!(
                        "ISW OTP validation failed ({}): {}",
                        parsed.response_code.as_deref().unwrap_or("unknown"),
                        parsed.error_message()
                    ))
                } else {
                    Err(format!(
                        "ISW OTP validation failed ({}): {}",
                        parsed.response_code.as_deref().unwrap_or("unknown"),
                        parsed.message.as_deref().unwrap_or("Unknown error")
                    ))
                }
            }
            Err(_) => Err(format!("ISW OTP validation failed ({}): {}", status, resp_body)),
        }
    }

    /// Query the status of a previously submitted transaction.
    #[allow(dead_code)]
    pub async fn get_transaction_status(
        &self,
        transaction_ref: &str,
    ) -> Result<TransactionStatusResponse, String> {
        let token = self.auth.get_token().await?;

        let resp = self
            .client
            .get(format!(
                "{}/api/v3/purchases/{}",
                self.base_url, transaction_ref
            ))
            .bearer_auth(&token)
            .send()
            .await
            .map_err(|e| format!("ISW status query failed: {}", e))?;

        if resp.status().is_success() {
            resp.json::<TransactionStatusResponse>()
                .await
                .map_err(|e| format!("Failed to parse ISW status response: {}", e))
        } else {
            let body = resp.text().await.unwrap_or_default();
            Err(format!("ISW status query failed: {}", body))
        }
    }
}
