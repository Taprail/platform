use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{Duration, Utc};
use hmac::{Hmac, Mac};
use rand::Rng;
use sha2::Sha256;
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{
    ApiResponse, CreateSessionRequest, PaymentSession, SessionResponse,
    TransactionResponse, VerifySessionRequest, session_status,
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
    if ctx.tier != "infra" {
        return Err(ApiError::Forbidden("This endpoint requires 'infra' tier".into()));
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
        "INSERT INTO payment_sessions (id, business_id, merchant_ref, amount, nonce, status, signature, metadata, expires_at, environment) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
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
    .bind(&ctx.environment)
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

pub async fn complete_session(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    _config: web::Data<crate::config::AppConfig>,
    isw_service: web::Data<crate::services::InterswitchPaymentService>,
    webhook_service: web::Data<crate::services::WebhookDeliveryService>,
    path: web::Path<Uuid>,
    body: web::Json<crate::db::InfraCompleteRequest>,
) -> Result<HttpResponse, ApiError> {
    let ctx = get_ctx(&req, pool.get_ref()).await?;
    let session_id = path.into_inner();

    let session: Option<PaymentSession> = sqlx::query_as(
        "SELECT * FROM payment_sessions WHERE id = $1 AND business_id = $2 FOR UPDATE"
    )
    .bind(session_id)
    .bind(ctx.business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let session = session.ok_or_else(|| ApiError::NotFound("Session not found".into()))?;

    if session.status != session_status::LOCKED {
        return Err(ApiError::BadRequest("Session is not locked".into()));
    }

    let fee = (session.amount * ctx.fee_percent / 100.0).min(ctx.fee_cap);
    let net_amount = session.amount - fee;
    let amount_kobo = (session.amount * 100.0) as i64;
    let payment_reference = format!("taprail_{}", Uuid::new_v4());

    let isw_result = isw_service
        .purchase(
            amount_kobo,
            &payment_reference,
            &body.customer_id,
            &body.pan,
            &body.pin,
            &body.expiry_date,
            &body.cvv,
        )
        .await;

    match isw_result {
        Ok((resp, auth_data)) if resp.needs_otp() => {
            // T0: OTP required — park the session and wait for OTP submission
            let otp_message = resp.message.as_deref().unwrap_or("OTP sent to cardholder");

            sqlx::query(
                "UPDATE payment_sessions SET status = $1, provider_ref = $2, payment_reference = $3, encrypted_auth_data = $4, computed_fee = $5, computed_net_amount = $6 WHERE id = $7"
            )
            .bind(session_status::AWAITING_OTP)
            .bind(&resp.payment_id)
            .bind(&payment_reference)
            .bind(&auth_data)
            .bind(fee)
            .bind(net_amount)
            .bind(session_id)
            .execute(pool.get_ref())
            .await?;

            Ok(HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "data": {
                    "session_id": session_id,
                    "status": "awaiting_otp",
                    "message": otp_message,
                },
                "message": "OTP required"
            })))
        }
        Ok((resp, _auth_data)) => {
            // Approved — create success transaction with enriched metadata
            let mut txn_metadata = session.metadata.clone().unwrap_or_else(|| serde_json::json!({}));
            if let Some(obj) = txn_metadata.as_object_mut() {
                if let Some(ref rrn) = resp.retrieval_reference_number {
                    obj.insert("isw_rrn".to_string(), serde_json::json!(rrn));
                }
                if let Some(ref code) = resp.response_code {
                    obj.insert("isw_response_code".to_string(), serde_json::json!(code));
                }
            }

            sqlx::query(
                "INSERT INTO transactions (business_id, session_id, amount, fee, net_amount, status, payment_reference, merchant_ref, metadata, provider_reference, environment) \
                 VALUES ($1, $2, $3, $4, $5, 'success', $6, $7, $8, $9, $10)"
            )
            .bind(ctx.business_id)
            .bind(session_id)
            .bind(session.amount)
            .bind(fee)
            .bind(net_amount)
            .bind(&payment_reference)
            .bind(&session.merchant_ref)
            .bind(&txn_metadata)
            .bind(&resp.payment_id)
            .bind(&ctx.environment)
            .execute(pool.get_ref())
            .await?;

            sqlx::query("UPDATE payment_sessions SET status = $1, payment_reference = $2 WHERE id = $3")
                .bind(session_status::PAID)
                .bind(&payment_reference)
                .bind(session_id)
                .execute(pool.get_ref())
                .await?;

            webhook_service.dispatch(pool.get_ref(), ctx.business_id, "session.paid", serde_json::json!({
                "session_id": session_id,
                "amount": session.amount,
                "fee": fee,
                "net_amount": net_amount,
                "payment_reference": payment_reference,
                "isw_payment_id": resp.payment_id,
                "isw_rrn": resp.retrieval_reference_number,
                "status": "paid",
            })).await;

            Ok(HttpResponse::Ok().json(ApiResponse::<()>::success((), "Payment processed")))
        }
        Err(err) => {
            let failure_reason = format!("{}", err);
            sqlx::query(
                "INSERT INTO transactions (business_id, session_id, amount, fee, net_amount, status, payment_reference, merchant_ref, metadata, failure_reason, environment) \
                 VALUES ($1, $2, $3, $4, $5, 'failed', $6, $7, $8, $9, $10)"
            )
            .bind(ctx.business_id)
            .bind(session_id)
            .bind(session.amount)
            .bind(fee)
            .bind(net_amount)
            .bind(&payment_reference)
            .bind(&session.merchant_ref)
            .bind(&session.metadata)
            .bind(&failure_reason)
            .bind(&ctx.environment)
            .execute(pool.get_ref())
            .await?;

            webhook_service.dispatch(pool.get_ref(), ctx.business_id, "charge.failed", serde_json::json!({
                "session_id": session_id,
                "payment_reference": payment_reference,
                "error": &failure_reason,
            })).await;

            Err(ApiError::payment_failed(
                format!("Payment declined: {}", failure_reason),
                None,
            ))
        }
    }
}

pub async fn submit_otp(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    isw_service: web::Data<crate::services::InterswitchPaymentService>,
    webhook_service: web::Data<crate::services::WebhookDeliveryService>,
    path: web::Path<Uuid>,
    body: web::Json<crate::db::InfraOtpRequest>,
) -> Result<HttpResponse, ApiError> {
    let ctx = get_ctx(&req, pool.get_ref()).await?;
    let session_id = path.into_inner();

    let session: Option<PaymentSession> = sqlx::query_as(
        "SELECT * FROM payment_sessions WHERE id = $1 AND business_id = $2 FOR UPDATE"
    )
    .bind(session_id)
    .bind(ctx.business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let session = session.ok_or_else(|| ApiError::NotFound("Session not found".into()))?;

    if session.status != session_status::AWAITING_OTP {
        return Err(ApiError::BadRequest("Session is not awaiting OTP".into()));
    }

    // Enforce OTP retry limit (max 3 attempts)
    if session.otp_attempts >= 3 {
        sqlx::query("UPDATE payment_sessions SET status = 'failed', encrypted_auth_data = NULL WHERE id = $1")
            .bind(session_id)
            .execute(pool.get_ref())
            .await?;
        return Err(ApiError::BadRequest("Maximum OTP attempts exceeded. Session has been cancelled.".into()));
    }

    // Increment OTP attempt counter
    sqlx::query("UPDATE payment_sessions SET otp_attempts = otp_attempts + 1 WHERE id = $1")
        .bind(session_id)
        .execute(pool.get_ref())
        .await?;

    let payment_id = session.provider_ref.as_deref()
        .ok_or_else(|| ApiError::Internal("Missing ISW payment ID for OTP session".into()))?;
    let payment_reference = session.payment_reference.as_deref()
        .ok_or_else(|| ApiError::Internal("Missing payment reference for OTP session".into()))?;
    let auth_data = session.encrypted_auth_data.as_deref()
        .ok_or_else(|| ApiError::Internal("Missing auth data for OTP session".into()))?;

    // Use stored fee from complete_session for consistency
    let fee = session.computed_fee.unwrap_or_else(|| (session.amount * ctx.fee_percent / 100.0).min(ctx.fee_cap));
    let net_amount = session.computed_net_amount.unwrap_or_else(|| session.amount - fee);

    let otp_result = isw_service
        .validate_otp(payment_id, auth_data, &body.otp)
        .await;

    match otp_result {
        Ok(resp) => {
            let mut txn_metadata = session.metadata.clone().unwrap_or_else(|| serde_json::json!({}));
            if let Some(obj) = txn_metadata.as_object_mut() {
                if let Some(ref rrn) = resp.retrieval_reference_number {
                    obj.insert("isw_rrn".to_string(), serde_json::json!(rrn));
                }
                if let Some(ref code) = resp.response_code {
                    obj.insert("isw_response_code".to_string(), serde_json::json!(code));
                }
            }

            sqlx::query(
                "INSERT INTO transactions (business_id, session_id, amount, fee, net_amount, status, payment_reference, merchant_ref, metadata, provider_reference, environment) \
                 VALUES ($1, $2, $3, $4, $5, 'success', $6, $7, $8, $9, $10)"
            )
            .bind(ctx.business_id)
            .bind(session_id)
            .bind(session.amount)
            .bind(fee)
            .bind(net_amount)
            .bind(payment_reference)
            .bind(&session.merchant_ref)
            .bind(&txn_metadata)
            .bind(&resp.payment_id)
            .bind(&ctx.environment)
            .execute(pool.get_ref())
            .await?;

            sqlx::query("UPDATE payment_sessions SET status = $1, encrypted_auth_data = NULL WHERE id = $2")
                .bind(session_status::PAID)
                .bind(session_id)
                .execute(pool.get_ref())
                .await?;

            webhook_service.dispatch(pool.get_ref(), ctx.business_id, "session.paid", serde_json::json!({
                "session_id": session_id,
                "amount": session.amount,
                "fee": fee,
                "net_amount": net_amount,
                "payment_reference": payment_reference,
                "isw_payment_id": resp.payment_id,
                "isw_rrn": resp.retrieval_reference_number,
                "status": "paid",
            })).await;

            Ok(HttpResponse::Ok().json(ApiResponse::<()>::success((), "Payment completed")))
        }
        Err(err) => {
            let failure_reason = err.to_string();
            sqlx::query(
                "INSERT INTO transactions (business_id, session_id, amount, fee, net_amount, status, payment_reference, merchant_ref, metadata, failure_reason, environment) \
                 VALUES ($1, $2, $3, $4, $5, 'failed', $6, $7, $8, $9, $10)"
            )
            .bind(ctx.business_id)
            .bind(session_id)
            .bind(session.amount)
            .bind(fee)
            .bind(net_amount)
            .bind(payment_reference)
            .bind(&session.merchant_ref)
            .bind(&session.metadata)
            .bind(&failure_reason)
            .bind(&ctx.environment)
            .execute(pool.get_ref())
            .await?;

            // Reset session so it can be retried or cancelled; clear auth data
            sqlx::query("UPDATE payment_sessions SET status = $1, encrypted_auth_data = NULL WHERE id = $2")
                .bind(session_status::LOCKED)
                .bind(session_id)
                .execute(pool.get_ref())
                .await?;

            webhook_service.dispatch(pool.get_ref(), ctx.business_id, "charge.failed", serde_json::json!({
                "session_id": session_id,
                "payment_reference": payment_reference,
                "error": err.to_string(),
            })).await;

            Err(ApiError::BadRequest(format!("OTP validation failed: {}", err)))
        }
    }
}

pub async fn cancel_session(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    webhook_service: web::Data<crate::services::WebhookDeliveryService>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let ctx = get_ctx(&req, pool.get_ref()).await?;
    let session_id = path.into_inner();

    let result = sqlx::query(
        "UPDATE payment_sessions SET status = $1 WHERE id = $2 AND business_id = $3 AND status IN ('pending', 'locked')"
    )
    .bind(session_status::CANCELLED)
    .bind(session_id)
    .bind(ctx.business_id)
    .execute(pool.get_ref())
    .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("Session not found or cannot be cancelled".into()));
    }

    webhook_service.dispatch(pool.get_ref(), ctx.business_id, "session.cancelled", serde_json::json!({
        "session_id": session_id,
        "status": "cancelled",
    })).await;

    Ok(HttpResponse::Ok().json(ApiResponse::<()>::success((), "Session cancelled")))
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
