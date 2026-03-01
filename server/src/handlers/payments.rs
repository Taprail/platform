use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{Duration, Utc};
use hmac::{Hmac, Mac};
use rand::Rng;
use sha2::Sha256;
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{
    ApiResponse, ChargeSessionRequest, CreateSessionRequest, PaymentSession,
    SessionResponse, TransactionResponse, VerifySessionRequest, session_status,
};
use crate::errors::ApiError;
use crate::middleware::api_key::{extract_business_context, BusinessContext};

type HmacSha256 = Hmac<Sha256>;

fn generate_signature(data: &str, secret: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(data.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

fn verify_signature(data: &str, secret: &str, signature: &str) -> bool {
    generate_signature(data, secret) == signature
}

async fn get_ctx(req: &HttpRequest, pool: &PgPool) -> Result<BusinessContext, ApiError> {
    let ctx = extract_business_context(req, pool).await?;
    if ctx.tier != "platform" {
        return Err(ApiError::Forbidden("This endpoint requires 'platform' tier".into()));
    }
    Ok(ctx)
}

pub async fn create_session(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    webhook_service: web::Data<crate::services::WebhookDeliveryService>,
    body: web::Json<CreateSessionRequest>,
) -> Result<HttpResponse, ApiError> {
    let ctx = get_ctx(&req, pool.get_ref()).await?;

    if body.amount <= 0.0 {
        return Err(ApiError::BadRequest("Amount must be positive".into()));
    }
    if body.amount > 10_000_000.0 {
        return Err(ApiError::BadRequest("Amount exceeds maximum allowed".into()));
    }

    let session_id = Uuid::new_v4();
    let nonce: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(16)
        .map(char::from)
        .collect();

    let expires_at = Utc::now() + Duration::minutes(5);

    // Use business webhook_secret for session signatures (not global JWT secret)
    let (business_secret,): (String,) = sqlx::query_as(
        "SELECT webhook_secret FROM businesses WHERE id = $1"
    )
    .bind(ctx.business_id)
    .fetch_one(pool.get_ref())
    .await?;

    let payload = format!(
        "{}|{}|{}|{}|{}",
        session_id, ctx.business_id, body.amount, nonce, expires_at.timestamp()
    );
    let signature = generate_signature(&payload, &business_secret);

    sqlx::query(
        "INSERT INTO payment_sessions (id, business_id, merchant_ref, amount, nonce, status, signature, metadata, expires_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"
    )
    .bind(session_id)
    .bind(ctx.business_id)
    .bind(&body.merchant_ref)
    .bind(body.amount)
    .bind(&nonce)
    .bind(session_status::PENDING)
    .bind(&signature)
    .bind(&body.metadata)
    .bind(expires_at)
    .execute(pool.get_ref())
    .await?;

    webhook_service.dispatch(pool.get_ref(), ctx.business_id, "session.created", serde_json::json!({
        "session_id": session_id,
        "amount": body.amount,
        "merchant_ref": body.merchant_ref,
        "status": "pending",
    })).await;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        SessionResponse {
            id: session_id,
            merchant_ref: body.merchant_ref.clone(),
            amount: body.amount,
            currency: "NGN".to_string(),
            nonce,
            status: session_status::PENDING.to_string(),
            signature,
            metadata: body.metadata.clone(),
            expires_at,
            created_at: Utc::now(),
        },
        "Session created",
    )))
}

pub async fn get_session(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let ctx = get_ctx(&req, pool.get_ref()).await?;
    let session_id = path.into_inner();

    let session: Option<PaymentSession> = sqlx::query_as(
        "SELECT * FROM payment_sessions WHERE id = $1 AND business_id = $2"
    )
    .bind(session_id)
    .bind(ctx.business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let session = session.ok_or_else(|| ApiError::NotFound("Session not found".into()))?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        SessionResponse::from(session),
        "Session retrieved",
    )))
}

pub async fn verify_session(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    webhook_service: web::Data<crate::services::WebhookDeliveryService>,
    path: web::Path<Uuid>,
    body: web::Json<VerifySessionRequest>,
) -> Result<HttpResponse, ApiError> {
    let ctx = get_ctx(&req, pool.get_ref()).await?;
    let session_id = path.into_inner();

    let session: Option<PaymentSession> = sqlx::query_as(
        "SELECT * FROM payment_sessions WHERE id = $1 AND business_id = $2"
    )
    .bind(session_id)
    .bind(ctx.business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let session = session.ok_or_else(|| ApiError::NotFound("Session not found".into()))?;

    if session.status != session_status::PENDING {
        return Err(ApiError::BadRequest("Session is not pending".into()));
    }

    if session.expires_at < Utc::now() {
        sqlx::query("UPDATE payment_sessions SET status = $1 WHERE id = $2")
            .bind(session_status::EXPIRED)
            .bind(session_id)
            .execute(pool.get_ref())
            .await?;
        webhook_service.dispatch(pool.get_ref(), ctx.business_id, "session.expired", serde_json::json!({
            "session_id": session_id,
            "status": "expired",
        })).await;
        return Err(ApiError::BadRequest("Session has expired".into()));
    }

    let (business_secret,): (String,) = sqlx::query_as(
        "SELECT webhook_secret FROM businesses WHERE id = $1"
    )
    .bind(ctx.business_id)
    .fetch_one(pool.get_ref())
    .await?;

    let payload = format!(
        "{}|{}|{}|{}|{}",
        session.id, session.business_id, session.amount, session.nonce, session.expires_at.timestamp()
    );

    if !verify_signature(&payload, &business_secret, &body.signature) {
        return Err(ApiError::BadRequest("Invalid signature".into()));
    }

    if session.nonce != body.nonce {
        return Err(ApiError::BadRequest("Invalid nonce".into()));
    }

    sqlx::query("UPDATE payment_sessions SET status = $1 WHERE id = $2")
        .bind(session_status::LOCKED)
        .bind(session_id)
        .execute(pool.get_ref())
        .await?;

    webhook_service.dispatch(pool.get_ref(), ctx.business_id, "session.verified", serde_json::json!({
        "session_id": session_id,
        "amount": session.amount,
        "status": "locked",
    })).await;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        SessionResponse::from(PaymentSession { status: session_status::LOCKED.to_string(), ..session }),
        "Session verified and locked",
    )))
}

pub async fn charge_session(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    _config: web::Data<crate::config::AppConfig>,
    switch_service: web::Data<crate::services::SwitchService>,
    webhook_service: web::Data<crate::services::WebhookDeliveryService>,
    path: web::Path<Uuid>,
    body: web::Json<ChargeSessionRequest>,
) -> Result<HttpResponse, ApiError> {
    let ctx = get_ctx(&req, pool.get_ref()).await?;
    let session_id = path.into_inner();

    let session: Option<PaymentSession> = sqlx::query_as(
        "SELECT * FROM payment_sessions WHERE id = $1 AND business_id = $2"
    )
    .bind(session_id)
    .bind(ctx.business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let session = session.ok_or_else(|| ApiError::NotFound("Session not found".into()))?;

    if session.status != session_status::LOCKED {
        return Err(ApiError::BadRequest("Session is not locked for payment".into()));
    }

    let payment_reference = format!("ref_{}", Uuid::new_v4());
    let fee = (session.amount * ctx.fee_percent / 100.0).min(ctx.fee_cap);
    let net_amount = session.amount - fee;
    let txn_id = Uuid::new_v4();

    // Call Beam Switch to process payment
    let charge_result = switch_service
        .charge_token(&body.payment_token, &body.email, session.amount, &payment_reference)
        .await;

    match charge_result {
        Ok(_) => {
            sqlx::query(
                "INSERT INTO transactions (id, business_id, session_id, amount, fee, net_amount, status, payment_reference, merchant_ref, metadata) \
                 VALUES ($1, $2, $3, $4, $5, $6, 'success', $7, $8, $9)"
            )
            .bind(txn_id)
            .bind(ctx.business_id)
            .bind(session_id)
            .bind(session.amount)
            .bind(fee)
            .bind(net_amount)
            .bind(&payment_reference)
            .bind(&session.merchant_ref)
            .bind(&session.metadata)
            .execute(pool.get_ref())
            .await?;

            sqlx::query("UPDATE payment_sessions SET status = $1 WHERE id = $2")
                .bind(session_status::PAID)
                .bind(session_id)
                .execute(pool.get_ref())
                .await?;

            // Dispatch webhooks
            let payload = serde_json::json!({
                "session_id": session_id,
                "transaction_id": txn_id,
                "amount": session.amount,
                "fee": fee,
                "net_amount": net_amount,
                "currency": "NGN",
                "payment_reference": payment_reference,
                "merchant_ref": session.merchant_ref,
            });
            webhook_service.dispatch(pool.get_ref(), ctx.business_id, "charge.succeeded", payload.clone()).await;
            webhook_service.dispatch(pool.get_ref(), ctx.business_id, "session.paid", payload).await;

            Ok(HttpResponse::Ok().json(ApiResponse::success(
                TransactionResponse {
                    id: txn_id,
                    session_id: Some(session_id),
                    amount: session.amount,
                    fee,
                    net_amount,
                    currency: "NGN".to_string(),
                    status: "success".to_string(),
                    payment_reference: Some(payment_reference),
                    merchant_ref: session.merchant_ref,
                    metadata: session.metadata,
                    created_at: Utc::now(),
                },
                "Payment processed successfully",
            )))
        }
        Err(err) => {
            // Record failed transaction
            sqlx::query(
                "INSERT INTO transactions (id, business_id, session_id, amount, fee, net_amount, status, payment_reference, merchant_ref, metadata) \
                 VALUES ($1, $2, $3, $4, $5, $6, 'failed', $7, $8, $9)"
            )
            .bind(txn_id)
            .bind(ctx.business_id)
            .bind(session_id)
            .bind(session.amount)
            .bind(fee)
            .bind(net_amount)
            .bind(&payment_reference)
            .bind(&session.merchant_ref)
            .bind(&session.metadata)
            .execute(pool.get_ref())
            .await?;

            let payload = serde_json::json!({
                "session_id": session_id,
                "transaction_id": txn_id,
                "amount": session.amount,
                "error": err.to_string(),
            });
            webhook_service.dispatch(pool.get_ref(), ctx.business_id, "charge.failed", payload).await;

            Err(ApiError::BadRequest(format!("Payment failed: {}", err)))
        }
    }
}

pub async fn list_transactions(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    query: web::Query<crate::db::TransactionQuery>,
) -> Result<HttpResponse, ApiError> {
    let ctx = get_ctx(&req, pool.get_ref()).await?;

    let txns: Vec<crate::db::Transaction> = sqlx::query_as(
        "SELECT * FROM transactions WHERE business_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    )
    .bind(ctx.business_id)
    .bind(query.limit())
    .bind(query.offset())
    .fetch_all(pool.get_ref())
    .await?;

    let txns: Vec<TransactionResponse> = txns.into_iter().map(Into::into).collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(txns, "Transactions retrieved")))
}

pub async fn get_transaction(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let ctx = get_ctx(&req, pool.get_ref()).await?;
    let txn_id = path.into_inner();

    let txn: Option<crate::db::Transaction> = sqlx::query_as(
        "SELECT * FROM transactions WHERE id = $1 AND business_id = $2"
    )
    .bind(txn_id)
    .bind(ctx.business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let txn = txn.ok_or_else(|| ApiError::NotFound("Transaction not found".into()))?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        TransactionResponse::from(txn),
        "Transaction retrieved",
    )))
}
