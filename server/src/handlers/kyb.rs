use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{
    ApiResponse, KybDocument, KybStatusResponse, KybSubmission, ReviewKybRequest,
    UpdateBusinessInfoRequest, UpdateDirectorInfoRequest, UploadDocumentRequest,
};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;
use crate::services::InterswitchIdentityService;

pub async fn get_kyb_status(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let submission: Option<KybSubmission> =
        sqlx::query_as("SELECT * FROM kyb_submissions WHERE business_id = $1")
            .bind(business_id)
            .fetch_optional(pool.get_ref())
            .await?;

    let documents: Vec<KybDocument> = if let Some(ref sub) = submission {
        sqlx::query_as(
            "SELECT * FROM kyb_documents WHERE kyb_submission_id = $1 ORDER BY uploaded_at DESC",
        )
        .bind(sub.id)
        .fetch_all(pool.get_ref())
        .await?
    } else {
        vec![]
    };

    let status = submission
        .as_ref()
        .map(|s| s.status.clone())
        .unwrap_or_else(|| "not_started".to_string());

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        KybStatusResponse {
            status,
            submission,
            documents,
        },
        "KYB status retrieved",
    )))
}

pub async fn create_kyb(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    // Check if submission already exists
    let existing: Option<KybSubmission> =
        sqlx::query_as("SELECT * FROM kyb_submissions WHERE business_id = $1")
            .bind(business_id)
            .fetch_optional(pool.get_ref())
            .await?;

    if let Some(existing) = existing {
        return Ok(HttpResponse::Ok().json(ApiResponse::success(
            existing,
            "KYB submission already exists",
        )));
    }

    let submission: KybSubmission = sqlx::query_as(
        "INSERT INTO kyb_submissions (business_id, status) VALUES ($1, 'in_progress') RETURNING *",
    )
    .bind(business_id)
    .fetch_one(pool.get_ref())
    .await?;

    sqlx::query("UPDATE businesses SET kyb_status = 'in_progress', updated_at = NOW() WHERE id = $1")
        .bind(business_id)
        .execute(pool.get_ref())
        .await?;

    let member_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| ApiError::Internal("Invalid member ID".into()))?;

    crate::handlers::audit::log_audit(
        pool.get_ref(),
        business_id,
        Some(member_id),
        Some(&claims.email),
        "create",
        "kyb_submission",
        Some(&submission.id.to_string()),
        None,
        crate::handlers::audit::get_ip(&req).as_deref(),
    )
    .await;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        submission,
        "KYB submission created",
    )))
}

pub async fn update_business_info(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<UpdateBusinessInfoRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let submission: KybSubmission = sqlx::query_as(
        "UPDATE kyb_submissions SET \
            registered_name = COALESCE($2, registered_name), \
            registration_number = COALESCE($3, registration_number), \
            business_type = COALESCE($4, business_type), \
            business_address = COALESCE($5, business_address), \
            city = COALESCE($6, city), \
            state = COALESCE($7, state), \
            country = COALESCE($8, country), \
            date_of_incorporation = COALESCE($9, date_of_incorporation), \
            industry = COALESCE($10, industry), \
            website = COALESCE($11, website), \
            description = COALESCE($12, description), \
            updated_at = NOW() \
         WHERE business_id = $1 \
         RETURNING *",
    )
    .bind(business_id)
    .bind(&body.registered_name)
    .bind(&body.registration_number)
    .bind(&body.business_type)
    .bind(&body.business_address)
    .bind(&body.city)
    .bind(&body.state)
    .bind(&body.country)
    .bind(&body.date_of_incorporation)
    .bind(&body.industry)
    .bind(&body.website)
    .bind(&body.description)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => {
            ApiError::NotFound("KYB submission not found. Create one first.".into())
        }
        other => ApiError::Db(other),
    })?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        submission,
        "Business info updated",
    )))
}

pub async fn update_director_info(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<UpdateDirectorInfoRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let submission: KybSubmission = sqlx::query_as(
        "UPDATE kyb_submissions SET \
            director_full_name = COALESCE($2, director_full_name), \
            director_email = COALESCE($3, director_email), \
            director_phone = COALESCE($4, director_phone), \
            director_bvn = COALESCE($5, director_bvn), \
            director_dob = COALESCE($6, director_dob), \
            director_address = COALESCE($7, director_address), \
            director_nationality = COALESCE($8, director_nationality), \
            updated_at = NOW() \
         WHERE business_id = $1 \
         RETURNING *",
    )
    .bind(business_id)
    .bind(&body.director_full_name)
    .bind(&body.director_email)
    .bind(&body.director_phone)
    .bind(&body.director_bvn)
    .bind(&body.director_dob)
    .bind(&body.director_address)
    .bind(&body.director_nationality)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => {
            ApiError::NotFound("KYB submission not found. Create one first.".into())
        }
        other => ApiError::Db(other),
    })?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        submission,
        "Director info updated",
    )))
}

pub async fn upload_document(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<UploadDocumentRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    // Validate document_type
    let valid_types = [
        "cac_certificate",
        "director_id",
        "utility_bill",
        "board_resolution",
        "other",
    ];
    if !valid_types.contains(&body.document_type.as_str()) {
        return Err(ApiError::BadRequest(format!(
            "Invalid document type. Must be one of: {}",
            valid_types.join(", ")
        )));
    }

    // Get the submission
    let submission: KybSubmission =
        sqlx::query_as("SELECT * FROM kyb_submissions WHERE business_id = $1")
            .bind(business_id)
            .fetch_one(pool.get_ref())
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => {
                    ApiError::NotFound("KYB submission not found. Create one first.".into())
                }
                other => ApiError::Db(other),
            })?;

    let document: KybDocument = sqlx::query_as(
        "INSERT INTO kyb_documents (kyb_submission_id, business_id, document_type, file_name, file_url, file_size, mime_type) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    )
    .bind(submission.id)
    .bind(business_id)
    .bind(&body.document_type)
    .bind(&body.file_name)
    .bind(&body.file_url)
    .bind(body.file_size)
    .bind(&body.mime_type)
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        document,
        "Document uploaded",
    )))
}

pub async fn delete_document(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let document_id = path.into_inner();

    let result =
        sqlx::query("DELETE FROM kyb_documents WHERE id = $1 AND business_id = $2")
            .bind(document_id)
            .bind(business_id)
            .execute(pool.get_ref())
            .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("Document not found".into()));
    }

    Ok(HttpResponse::Ok().json(ApiResponse::<()>::success((), "Document deleted")))
}

pub async fn submit_kyb(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    isw_identity: web::Data<InterswitchIdentityService>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    // Fetch the submission and validate required fields
    let submission: KybSubmission =
        sqlx::query_as("SELECT * FROM kyb_submissions WHERE business_id = $1")
            .bind(business_id)
            .fetch_one(pool.get_ref())
            .await
            .map_err(|e| match e {
                sqlx::Error::RowNotFound => {
                    ApiError::NotFound("KYB submission not found. Create one first.".into())
                }
                other => ApiError::Db(other),
            })?;

    if submission.status == "pending_review" || submission.status == "approved" {
        return Err(ApiError::BadRequest(format!(
            "KYB submission is already {}",
            submission.status
        )));
    }

    // Allow resubmission after rejection
    if submission.status == "rejected" {
        log::info!("Re-submitting previously rejected KYB for business {}", business_id);
    }

    // Validate required business fields
    let mut missing = Vec::new();
    if submission.registered_name.is_none() {
        missing.push("registered_name");
    }
    if submission.registration_number.is_none() {
        missing.push("registration_number");
    }
    if submission.business_type.is_none() {
        missing.push("business_type");
    }
    if submission.business_address.is_none() {
        missing.push("business_address");
    }
    if submission.city.is_none() {
        missing.push("city");
    }
    if submission.state.is_none() {
        missing.push("state");
    }

    // Validate required director fields
    if submission.director_full_name.is_none() {
        missing.push("director_full_name");
    }
    if submission.director_email.is_none() {
        missing.push("director_email");
    }
    if submission.director_phone.is_none() {
        missing.push("director_phone");
    }
    if submission.director_bvn.is_none() {
        missing.push("director_bvn");
    }

    if !missing.is_empty() {
        return Err(ApiError::BadRequest(format!(
            "Missing required fields: {}",
            missing.join(", ")
        )));
    }

    // Check that at least one document is uploaded
    let doc_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM kyb_documents WHERE kyb_submission_id = $1",
    )
    .bind(submission.id)
    .fetch_one(pool.get_ref())
    .await?;

    if doc_count.0 == 0 {
        return Err(ApiError::BadRequest(
            "At least one document must be uploaded before submission".into(),
        ));
    }

    // -----------------------------------------------------------
    // ISW Identity Verification: BVN + AML
    // -----------------------------------------------------------
    let bvn = submission.director_bvn.as_deref().unwrap();
    let full_name = submission.director_full_name.as_deref().unwrap();
    let phone = submission.director_phone.as_deref().unwrap();
    let dob = submission.director_dob.as_deref().unwrap_or("");
    // ISW requires ISO alpha-3 country codes
    let country_raw = submission.country.as_deref().unwrap_or("NG");
    let country_alpha3 = match country_raw {
        "NG" => "NGA",
        "GH" => "GHA",
        "KE" => "KEN",
        "ZA" => "ZAF",
        other if other.len() == 3 => other,
        _ => "NGA",
    };

    // Split director_full_name into first + last
    let name_parts: Vec<&str> = full_name.splitn(2, ' ').collect();
    let first_name = name_parts.first().unwrap_or(&"");
    let last_name = name_parts.get(1).unwrap_or(&"");

    // ISW requires a callback URL for async verification results
    let callback_url = format!("https://api.taprail.io/webhooks/isw/kyb/{}", submission.id);

    let verification_result = isw_identity
        .verify_bvn_and_aml(bvn, first_name, last_name, phone, dob, country_alpha3, &callback_url)
        .await;

    let (bvn_verified, bvn_ref, bvn_failure, aml_status, aml_failure, raw_response) =
        match &verification_result {
            Ok(resp) => {
                let raw = serde_json::to_value(resp).ok();

                let bvn_result = resp.bvn_result();
                let bvn_ok = bvn_result
                    .map(|r| r.status == "VERIFIED" || r.status == "MATCH")
                    .unwrap_or(false);
                let bvn_ref = bvn_result.and_then(|r| r.reference.clone());
                let bvn_fail = if !bvn_ok {
                    bvn_result.and_then(|r| r.failure_description.clone())
                } else {
                    None
                };

                let aml_result = resp.aml_result();
                let aml_st = aml_result.map(|r| r.status.clone());
                let aml_fail = aml_result.and_then(|r| r.failure_description.clone());

                (bvn_ok, bvn_ref, bvn_fail, aml_st, aml_fail, raw)
            }
            Err(e) => {
                log::error!("ISW identity verification failed for business {}: {}", business_id, e);
                (
                    false,
                    None,
                    Some(e.clone()),
                    None,
                    None,
                    Some(serde_json::json!({ "error": e })),
                )
            }
        };

    // Determine final status: if BVN verified → pending_review, otherwise → rejected
    let new_status = if bvn_verified {
        "pending_review"
    } else {
        "rejected"
    };

    let rejection_reason: Option<String> = if !bvn_verified {
        Some(format!(
            "BVN verification failed: {}",
            bvn_failure.as_deref().unwrap_or("Unknown error")
        ))
    } else {
        None
    };

    let updated: KybSubmission = sqlx::query_as(
        "UPDATE kyb_submissions SET \
            status = $2, \
            submitted_at = NOW(), \
            bvn_verified = $3, \
            bvn_verification_ref = $4, \
            bvn_failure_reason = $5, \
            aml_status = $6, \
            aml_failure_reason = $7, \
            verification_raw_response = $8, \
            rejection_reason = $9, \
            updated_at = NOW() \
         WHERE business_id = $1 RETURNING *",
    )
    .bind(business_id)
    .bind(new_status)
    .bind(bvn_verified)
    .bind(&bvn_ref)
    .bind(&bvn_failure)
    .bind(&aml_status)
    .bind(&aml_failure)
    .bind(&raw_response)
    .bind(&rejection_reason)
    .fetch_one(pool.get_ref())
    .await?;

    let biz_status = if bvn_verified {
        "pending_review"
    } else {
        "rejected"
    };
    sqlx::query("UPDATE businesses SET kyb_status = $2, updated_at = NOW() WHERE id = $1")
        .bind(business_id)
        .bind(biz_status)
        .execute(pool.get_ref())
        .await?;

    let member_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| ApiError::Internal("Invalid member ID".into()))?;

    crate::handlers::audit::log_audit(
        pool.get_ref(),
        business_id,
        Some(member_id),
        Some(&claims.email),
        "submit",
        "kyb_submission",
        Some(&updated.id.to_string()),
        Some(serde_json::json!({
            "bvn_verified": bvn_verified,
            "aml_status": &aml_status,
            "status": new_status,
        })),
        crate::handlers::audit::get_ip(&req).as_deref(),
    )
    .await;

    let message = if bvn_verified {
        "KYB submitted — BVN verified, pending review"
    } else {
        "KYB submission rejected — BVN verification failed"
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(updated, message)))
}

pub async fn review_kyb(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
    body: web::Json<ReviewKybRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims
        .business_id
        .parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let submission_id = path.into_inner();

    // Only owner or admin can review
    if claims.role != "owner" && claims.role != "admin" {
        return Err(ApiError::Forbidden(
            "Only owner or admin can review KYB submissions".into(),
        ));
    }

    // Validate status
    if body.status != "approved" && body.status != "rejected" {
        return Err(ApiError::BadRequest(
            "Review status must be 'approved' or 'rejected'".into(),
        ));
    }

    if body.status == "rejected" && body.rejection_reason.is_none() {
        return Err(ApiError::BadRequest(
            "Rejection reason is required when rejecting".into(),
        ));
    }

    let reviewer_id: Uuid = claims
        .sub
        .parse()
        .map_err(|_| ApiError::Internal("Invalid member ID".into()))?;

    let updated: KybSubmission = sqlx::query_as(
        "UPDATE kyb_submissions SET \
            status = $2, \
            reviewed_at = NOW(), \
            reviewed_by = $3, \
            rejection_reason = $4, \
            updated_at = NOW() \
         WHERE id = $1 \
         RETURNING *",
    )
    .bind(submission_id)
    .bind(&body.status)
    .bind(reviewer_id)
    .bind(&body.rejection_reason)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => ApiError::NotFound("KYB submission not found".into()),
        other => ApiError::Db(other),
    })?;

    sqlx::query("UPDATE businesses SET kyb_status = $2, updated_at = NOW() WHERE id = $1")
        .bind(business_id)
        .execute(pool.get_ref())
        .await?;

    crate::handlers::audit::log_audit(
        pool.get_ref(),
        business_id,
        Some(reviewer_id),
        Some(&claims.email),
        "review",
        "kyb_submission",
        Some(&submission_id.to_string()),
        Some(serde_json::json!({
            "status": &body.status,
            "rejection_reason": &body.rejection_reason
        })),
        crate::handlers::audit::get_ip(&req).as_deref(),
    )
    .await;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        updated,
        &format!("KYB submission {}", body.status),
    )))
}
