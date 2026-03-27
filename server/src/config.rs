use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub default_fee_percent: f64,
    pub default_fee_cap: f64,
    pub beam_switch_url: String,
    pub isw: InterswitchConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct InterswitchConfig {
    /// Interswitch Passport OAuth URL (e.g. https://passport.interswitchng.com)
    pub passport_url: String,
    /// Interswitch payment gateway base URL
    pub base_url: String,
    pub client_id: String,
    pub client_secret: String,
    /// Merchant code assigned by Interswitch
    pub merchant_code: String,
    /// Pay Item ID for card payments
    pub pay_item_id: String,
    /// RSA modulus (hex) for authData encryption — provided by ISW
    pub rsa_modulus: String,
    /// RSA public exponent (hex), typically "010001"
    pub rsa_exponent: String,
    /// Identity/KYC service base URL
    pub identity_base_url: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            default_fee_percent: 1.5,
            default_fee_cap: 2000.0,
            beam_switch_url: "http://localhost:8080".to_string(),
            isw: InterswitchConfig {
                passport_url: "https://passport.interswitchng.com".to_string(),
                base_url: "https://saturn.interswitchng.com".to_string(),
                client_id: String::new(),
                client_secret: String::new(),
                merchant_code: String::new(),
                pay_item_id: String::new(),
                rsa_modulus: String::new(),
                rsa_exponent: "010001".to_string(),
                identity_base_url: "https://kyc-service.k8.isw.la".to_string(),
            },
        }
    }
}
