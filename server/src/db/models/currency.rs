use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct SupportedCurrency {
    pub code: String,
    pub name: String,
    pub symbol: String,
    pub minor_unit: i32,
    pub is_active: bool,
}
