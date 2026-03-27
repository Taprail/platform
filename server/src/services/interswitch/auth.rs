use reqwest::Client;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::types::PassportTokenResponse;

/// Handles Interswitch Passport OAuth2 client-credentials flow.
/// Caches the access token and refreshes it before expiry.
pub struct InterswitchAuth {
    client: Client,
    passport_url: String,
    client_id: String,
    client_secret: String,
    cached: Arc<RwLock<Option<CachedToken>>>,
}

struct CachedToken {
    access_token: String,
    expires_at: chrono::DateTime<chrono::Utc>,
}

impl InterswitchAuth {
    pub fn new(
        passport_url: String,
        client_id: String,
        client_secret: String,
    ) -> Self {
        Self {
            client: Client::new(),
            passport_url,
            client_id,
            client_secret,
            cached: Arc::new(RwLock::new(None)),
        }
    }

    /// Returns a valid access token, refreshing if necessary.
    pub async fn get_token(&self) -> Result<String, String> {
        // Check cache
        {
            let guard = self.cached.read().await;
            if let Some(ref cached) = *guard {
                if cached.expires_at > chrono::Utc::now() + chrono::Duration::seconds(30) {
                    return Ok(cached.access_token.clone());
                }
            }
        }

        // Refresh
        let token = self.fetch_token().await?;
        Ok(token)
    }

    async fn fetch_token(&self) -> Result<String, String> {
        let resp = self
            .client
            .post(format!("{}/passport/oauth/token", self.passport_url))
            .basic_auth(&self.client_id, Some(&self.client_secret))
            .form(&[("grant_type", "client_credentials")])
            .send()
            .await
            .map_err(|e| format!("Passport auth request failed: {}", e))?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(format!("Passport auth failed: {}", body));
        }

        let token_resp: PassportTokenResponse = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse Passport token: {}", e))?;

        let expires_at =
            chrono::Utc::now() + chrono::Duration::seconds(token_resp.expires_in);

        let access_token = token_resp.access_token.clone();

        let mut guard = self.cached.write().await;
        *guard = Some(CachedToken {
            access_token: access_token.clone(),
            expires_at,
        });

        Ok(access_token)
    }
}
