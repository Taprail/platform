use reqwest::Client;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SwitchVerifyResponse {
    pub status: String,
    pub reference: String,
    pub amount: Option<i64>,
}

pub struct SwitchService {
    client: Client,
    base_url: String,
}

impl SwitchService {
    pub fn new(base_url: String) -> Self {
        Self {
            client: Client::new(),
            base_url,
        }
    }

    pub async fn charge_token(
        &self,
        authorization_code: &str,
        email: &str,
        amount: f64,
        reference: &str,
    ) -> Result<String, String> {
        let amount_kobo = (amount * 100.0) as i64;

        let resp = self
            .client
            .post(format!("{}/charge/token", self.base_url))
            .json(&serde_json::json!({
                "authorization_code": authorization_code,
                "email": email,
                "amount": amount_kobo,
                "reference": reference,
            }))
            .send()
            .await
            .map_err(|e| format!("Switch request failed: {}", e))?;

        if resp.status().is_success() {
            Ok(reference.to_string())
        } else {
            let body = resp.text().await.unwrap_or_default();
            Err(format!("Charge failed: {}", body))
        }
    }

    pub async fn verify_transaction(
        &self,
        reference: &str,
    ) -> Result<SwitchVerifyResponse, String> {
        let resp = self
            .client
            .get(format!("{}/verify/{}", self.base_url, reference))
            .send()
            .await
            .map_err(|e| format!("Switch verify request failed: {}", e))?;

        if resp.status().is_success() {
            resp.json::<SwitchVerifyResponse>()
                .await
                .map_err(|e| format!("Failed to parse verify response: {}", e))
        } else {
            let body = resp.text().await.unwrap_or_default();
            Err(format!("Verify failed: {}", body))
        }
    }
}
