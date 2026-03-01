use sqlx::{postgres::PgPool, Error};

pub mod models;
pub use models::*;

pub async fn init_db(database_url: &str) -> Result<PgPool, Error> {
    let pool = PgPool::connect(database_url).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    log::info!("Symble database initialized");
    Ok(pool)
}
