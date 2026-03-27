use actix_cors::Cors;
use actix_web::{web, App, HttpRequest, HttpResponse, HttpServer};
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
        isw: config::InterswitchConfig {
            passport_url: env::var("ISW_PASSPORT_URL")
                .unwrap_or_else(|_| "https://passport.interswitchng.com".to_string()),
            base_url: env::var("ISW_BASE_URL")
                .unwrap_or_else(|_| "https://saturn.interswitchng.com".to_string()),
            client_id: env::var("ISW_CLIENT_ID").unwrap_or_default(),
            client_secret: env::var("ISW_CLIENT_SECRET").unwrap_or_default(),
            merchant_code: env::var("ISW_MERCHANT_CODE").unwrap_or_default(),
            pay_item_id: env::var("ISW_PAY_ITEM_ID_CARD").unwrap_or_default(),
            rsa_modulus: env::var("ISW_RSA_MODULUS").unwrap_or_default(),
            rsa_exponent: env::var("ISW_RSA_EXPONENT").unwrap_or_else(|_| "010001".to_string()),
            identity_base_url: env::var("ISW_IDENTITY_BASE_URL")
                .unwrap_or_else(|_| "https://kyc-service.k8.isw.la".to_string()),
        },
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

    let isw_auth = services::interswitch::InterswitchAuth::new(
        config.isw.passport_url.clone(),
        config.isw.client_id.clone(),
        config.isw.client_secret.clone(),
    );
    let isw_service = web::Data::new(services::InterswitchPaymentService::new(
        config.isw.base_url.clone(),
        isw_auth,
        config.isw.merchant_code.clone(),
        config.isw.pay_item_id.clone(),
        config.isw.rsa_modulus.clone(),
        config.isw.rsa_exponent.clone(),
    ));

    let isw_identity_auth = services::interswitch::InterswitchAuth::new(
        config.isw.passport_url.clone(),
        config.isw.client_id.clone(),
        config.isw.client_secret.clone(),
    );
    let isw_identity_service = web::Data::new(services::InterswitchIdentityService::new(
        config.isw.identity_base_url.clone(),
        isw_identity_auth,
    ));

    let webhook_service = web::Data::new(services::WebhookDeliveryService::new());

    let email_service = web::Data::new(services::EmailService::new(
        env::var("EMAIL_FROM").unwrap_or_else(|_| "noreply@taprail.co".to_string()),
    ));

    // Rate limiter: 100 requests per second per API key, burst up to 100
    let rate_limiter = web::Data::new(middleware::rate_limit::RateLimiter::new(100, 100.0));

    // Background task: webhook retry
    let retry_pool = pool.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(30));
        loop {
            interval.tick().await;
            services::WebhookDeliveryService::retry_pending(retry_pool.get_ref()).await;
        }
    });

    // Background task: session expiry
    let expiry_pool = pool.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(60));
        loop {
            interval.tick().await;
            let result = sqlx::query(
                "UPDATE payment_sessions SET status = 'expired' \
                 WHERE status IN ('pending', 'locked') AND expires_at < NOW()"
            )
            .execute(expiry_pool.get_ref())
            .await;
            if let Ok(r) = result {
                if r.rows_affected() > 0 {
                    log::info!("Expired {} stale sessions", r.rows_affected());
                }
            }
        }
    });

    // Background task: rate limiter cleanup
    let rl_clone = rate_limiter.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(60));
        loop {
            interval.tick().await;
            rl_clone.cleanup();
        }
    });

    // Background task: idempotency key cleanup
    let idem_pool = pool.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(3600));
        loop {
            interval.tick().await;
            let _ = sqlx::query("DELETE FROM idempotency_keys WHERE expires_at < NOW()")
                .execute(idem_pool.get_ref())
                .await;
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
            .app_data(isw_service.clone())
            .app_data(isw_identity_service.clone())
            .app_data(webhook_service.clone())
            .app_data(email_service.clone())
            .app_data(rate_limiter.clone())
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
            // Public: currencies
            // =================================================================
            .route("/currencies", web::get().to(handlers::currencies::list_currencies))
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
                    // Refunds
                    .route(
                        "/refunds",
                        web::get().to(handlers::refunds::list_refunds),
                    )
                    .route(
                        "/refunds",
                        web::post().to(handlers::refunds::create_refund),
                    )
                    .route(
                        "/refunds/{id}",
                        web::get().to(handlers::refunds::get_refund),
                    )
                    // Settlements
                    .route(
                        "/settlements",
                        web::get().to(handlers::settlements::list_settlements),
                    )
                    .route(
                        "/settlements/{id}",
                        web::get().to(handlers::settlements::get_settlement),
                    )
                    .route(
                        "/settlements/{id}/items",
                        web::get().to(handlers::settlements::get_settlement_items),
                    )
                    .route(
                        "/settlements/bank-account",
                        web::get().to(handlers::settlements::get_bank_account),
                    )
                    .route(
                        "/settlements/bank-account",
                        web::put().to(handlers::settlements::update_bank_account),
                    )
                    // Disputes
                    .route(
                        "/disputes",
                        web::get().to(handlers::disputes::list_disputes),
                    )
                    .route(
                        "/disputes/{id}",
                        web::get().to(handlers::disputes::get_dispute),
                    )
                    .route(
                        "/disputes/{id}",
                        web::put().to(handlers::disputes::update_dispute),
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
                        "/webhooks/deliveries/{id}",
                        web::get().to(handlers::webhooks::get_delivery),
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
                    // Customers
                    .route(
                        "/customers",
                        web::get().to(handlers::customers::list_customers),
                    )
                    .route(
                        "/customers",
                        web::post().to(handlers::customers::create_customer),
                    )
                    .route(
                        "/customers/{id}",
                        web::get().to(handlers::customers::get_customer),
                    )
                    .route(
                        "/customers/{id}",
                        web::put().to(handlers::customers::update_customer),
                    )
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
                    )
                    // Notifications
                    .route(
                        "/notifications/preferences",
                        web::get().to(handlers::notifications::get_preferences),
                    )
                    .route(
                        "/notifications/preferences",
                        web::put().to(handlers::notifications::update_preferences),
                    )
                    .route(
                        "/notifications/emails",
                        web::get().to(handlers::notifications::list_email_logs),
                    )
                    // Export
                    .route(
                        "/export",
                        web::get().to(handlers::exports::export_csv),
                    )
                    // KYB
                    .route("/kyb", web::get().to(handlers::kyb::get_kyb_status))
                    .route("/kyb", web::post().to(handlers::kyb::create_kyb))
                    .route(
                        "/kyb/business-info",
                        web::put().to(handlers::kyb::update_business_info),
                    )
                    .route(
                        "/kyb/director-info",
                        web::put().to(handlers::kyb::update_director_info),
                    )
                    .route(
                        "/kyb/documents",
                        web::post().to(handlers::kyb::upload_document),
                    )
                    .route(
                        "/kyb/documents/{id}",
                        web::delete().to(handlers::kyb::delete_document),
                    )
                    .route(
                        "/kyb/submit",
                        web::post().to(handlers::kyb::submit_kyb),
                    )
                    .route(
                        "/kyb/{id}/review",
                        web::put().to(handlers::kyb::review_kyb),
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
                        "/sessions/{id}/otp",
                        web::post().to(handlers::infra::submit_otp),
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
        "version": "0.2.0"
    }))
}

/// Rate-limit check helper for V1 API handlers.
/// Call at the top of any handler that should be rate-limited.
#[allow(dead_code)]
pub async fn check_rate_limit(
    req: &HttpRequest,
    limiter: &middleware::rate_limit::RateLimiter,
) -> Result<(), errors::ApiError> {
    let key = req
        .headers()
        .get("X-Beam-Key")
        .or_else(|| req.headers().get("Authorization"))
        .and_then(|v| v.to_str().ok())
        .unwrap_or("anonymous");

    match limiter.check(key) {
        Ok(_) => Ok(()),
        Err(retry_after) => Err(errors::ApiError::BadRequest(
            format!("Rate limit exceeded. Retry after {:.1}s", retry_after),
        )),
    }
}
