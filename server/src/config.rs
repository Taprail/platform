use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub default_fee_percent: f64,
    pub default_fee_cap: f64,
    pub beam_switch_url: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            default_fee_percent: 1.5,
            default_fee_cap: 2000.0,
            beam_switch_url: "http://localhost:8080".to_string(),
        }
    }
}
