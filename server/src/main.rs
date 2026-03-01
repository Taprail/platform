use actix_cors::Cors;
use actix_web::{web, App, HttpResponse, HttpServer};
use dotenv::dotenv;
use std::env;

mod config;
mod db;
mod errors;
mod handlers;
mod middleware;
mod services;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let database_url =
        env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://localhost/symble_db".to_string());
    let jwt_secret =
        env::var("JWT_SECRET").unwrap_or_else(|_| "symble-dev-secret".to_string());
    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8082".to_string())
        .parse()
        .unwrap_or(8082);

    let config = config::AppConfig {
        default_fee_percent: env::var("DEFAULT_FEE_PERCENT")
            .unwrap_or_else(|_| "1.5".to_string())
            .parse()
            .unwrap_or(1.5),
        default_fee_cap: env::var("DEFAULT_FEE_CAP")
            .unwrap_or_else(|_| "2000.0".to_string())
            .parse()
            .unwrap_or(2000.0),
        beam_switch_url: env::var("BEAM_SWITCH_URL")
            .unwrap_or_else(|_| "http://localhost:8080".to_string()),
    };

    log::info!("Starting Symble API on {}:{}", host, port);

    // Initialize database
    let pool = db::init_db(&database_url)
        .await
        .expect("Failed to initialize database");

    let pool = web::Data::new(pool);
    let jwt_secret = web::Data::new(jwt_secret);
    let config = web::Data::new(config.clone());

    // Initialize services
    let switch_service = web::Data::new(services::SwitchService::new(
        config.beam_switch_url.clone(),
    ));
    let webhook_service = web::Data::new(services::WebhookDeliveryService::new());

    // Spawn webhook retry background task
    let retry_pool = pool.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(30));
        loop {
            interval.tick().await;
            services::WebhookDeliveryService::retry_pending(retry_pool.get_ref()).await;
        }
    });

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .app_data(pool.clone())
            .app_data(jwt_secret.clone())
            .app_data(config.clone())
            .app_data(switch_service.clone())
            .app_data(webhook_service.clone())
            // =================================================================
            // Health
            // =================================================================
            .route("/health", web::get().to(health_check))
            // =================================================================
            // Auth (public)
            // =================================================================
            .service(
                web::scope("/auth")
                    .route("/register", web::post().to(handlers::auth::register))
                    .route("/login", web::post().to(handlers::auth::login)),
            )
            // =================================================================
            // Dashboard (JWT auth)
            // =================================================================
            .service(
                web::scope("/dashboard")
                    // Overview & Analytics
                    .route("/overview", web::get().to(handlers::analytics::get_overview))
                    .route(
                        "/overview/chart",
                        web::get().to(handlers::analytics::get_chart),
                    )
                    // Transactions
                    .route(
                        "/transactions",
                        web::get().to(handlers::transactions::list_transactions),
                    )
                    .route(
                        "/transactions/{id}",
                        web::get().to(handlers::transactions::get_transaction),
                    )
                    // API Keys
                    .route(
                        "/api-keys",
                        web::post().to(handlers::api_keys::create_api_keys),
                    )
                    .route(
                        "/api-keys",
                        web::get().to(handlers::api_keys::list_api_keys),
                    )
                    .route(
                        "/api-keys/{id}",
                        web::delete().to(handlers::api_keys::revoke_api_key),
                    )
                    // Webhooks
                    .route(
                        "/webhooks",
                        web::post().to(handlers::webhooks::create_endpoint),
                    )
                    .route(
                        "/webhooks",
                        web::get().to(handlers::webhooks::list_endpoints),
                    )
                    .route(
                        "/webhooks/{id}",
                        web::delete().to(handlers::webhooks::delete_endpoint),
                    )
                    .route(
                        "/webhooks/deliveries",
                        web::get().to(handlers::webhooks::list_deliveries),
                    )
                    .route(
                        "/webhooks/test",
                        web::post().to(handlers::webhooks::test_webhook),
                    )
                    // Team
                    .route("/team", web::get().to(handlers::team::list_team))
                    .route("/team", web::post().to(handlers::team::invite_member))
                    .route("/team/{id}", web::put().to(handlers::team::update_member))
                    .route("/team/{id}", web::delete().to(handlers::team::remove_member))
                    // Audit Log
                    .route(
                        "/audit-log",
                        web::get().to(handlers::audit::get_audit_log),
                    )
                    // Settings
                    .route(
                        "/settings",
                        web::get().to(handlers::settings::get_settings),
                    )
                    .route(
                        "/settings",
                        web::put().to(handlers::settings::update_settings),
                    )
                    .route(
                        "/settings/password",
                        web::put().to(handlers::settings::change_password),
                    ),
            )
            // =================================================================
            // V1 API: Path 1 - Infra (API key auth, tier=infra)
            // =================================================================
            .service(
                web::scope("/v1/infra")
                    .route(
                        "/sessions",
                        web::post().to(handlers::infra::create_session),
                    )
                    .route(
                        "/sessions/{id}",
                        web::get().to(handlers::infra::get_session),
                    )
                    .route(
                        "/sessions/{id}/verify",
                        web::post().to(handlers::infra::verify_session),
                    )
                    .route(
                        "/sessions/{id}/complete",
                        web::post().to(handlers::infra::complete_session),
                    )
                    .route(
                        "/sessions/{id}/cancel",
                        web::post().to(handlers::infra::cancel_session),
                    )
                    .route(
                        "/transactions",
                        web::get().to(handlers::infra::list_transactions),
                    ),
            )
            // =================================================================
            // V1 API: Path 2 - Payments (API key auth, tier=platform)
            // =================================================================
            .service(
                web::scope("/v1/payments")
                    .route(
                        "/sessions",
                        web::post().to(handlers::payments::create_session),
                    )
                    .route(
                        "/sessions/{id}",
                        web::get().to(handlers::payments::get_session),
                    )
                    .route(
                        "/sessions/{id}/verify",
                        web::post().to(handlers::payments::verify_session),
                    )
                    .route(
                        "/sessions/{id}/charge",
                        web::post().to(handlers::payments::charge_session),
                    )
                    .route(
                        "/transactions",
                        web::get().to(handlers::payments::list_transactions),
                    )
                    .route(
                        "/transactions/{id}",
                        web::get().to(handlers::payments::get_transaction),
                    ),
            )
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await
}

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "symble",
        "version": "0.1.0"
    }))
}
