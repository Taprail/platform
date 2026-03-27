use actix_web::{web, HttpResponse};
use sqlx::PgPool;

use crate::db::{ApiResponse, SupportedCurrency};
use crate::errors::ApiError;

pub async fn list_currencies(
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, ApiError> {
    let currencies = sqlx::query_as::<_, SupportedCurrency>(
        "SELECT * FROM supported_currencies WHERE is_active = TRUE ORDER BY code"
    )
    .fetch_all(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(currencies, "Currencies retrieved")))
}
