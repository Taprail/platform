use actix_web::{web, HttpRequest, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{ApiResponse, Customer, CustomerQuery, CustomerResponse, CreateCustomerRequest, UpdateCustomerRequest};
use crate::errors::ApiError;
use crate::middleware::dashboard_auth::extract_dashboard_claims;

pub async fn list_customers(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    query: web::Query<CustomerQuery>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    let customers = if let Some(ref search) = query.search {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customers WHERE business_id = $1 \
             AND (email ILIKE '%' || $2 || '%' OR name ILIKE '%' || $2 || '%' OR phone ILIKE '%' || $2 || '%') \
             ORDER BY created_at DESC LIMIT $3 OFFSET $4"
        )
        .bind(business_id)
        .bind(search)
        .bind(query.limit())
        .bind(query.offset())
        .fetch_all(pool.get_ref())
        .await?
    } else {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customers WHERE business_id = $1 \
             ORDER BY created_at DESC LIMIT $2 OFFSET $3"
        )
        .bind(business_id)
        .bind(query.limit())
        .bind(query.offset())
        .fetch_all(pool.get_ref())
        .await?
    };

    // Get transaction counts and volumes for each customer
    let customer_ids: Vec<Uuid> = customers.iter().map(|c| c.id).collect();

    let stats: Vec<(Uuid, Option<i64>, Option<f64>)> = if !customer_ids.is_empty() {
        sqlx::query_as(
            "SELECT customer_id, COUNT(*), COALESCE(SUM(amount), 0) \
             FROM transactions \
             WHERE customer_id = ANY($1) AND status = 'success' \
             GROUP BY customer_id"
        )
        .bind(&customer_ids)
        .fetch_all(pool.get_ref())
        .await?
    } else {
        vec![]
    };

    let responses: Vec<CustomerResponse> = customers.into_iter().map(|c| {
        let stat = stats.iter().find(|s| s.0 == c.id);
        CustomerResponse {
            id: c.id,
            email: c.email,
            phone: c.phone,
            name: c.name,
            metadata: c.metadata,
            transaction_count: stat.map(|s| s.1.unwrap_or(0)),
            total_volume: stat.map(|s| s.2.unwrap_or(0.0)),
            created_at: c.created_at,
        }
    }).collect();

    // Total count
    let total: (i64,) = if let Some(ref search) = query.search {
        sqlx::query_as(
            "SELECT COUNT(*) FROM customers WHERE business_id = $1 \
             AND (email ILIKE '%' || $2 || '%' OR name ILIKE '%' || $2 || '%' OR phone ILIKE '%' || $2 || '%')"
        )
        .bind(business_id)
        .bind(search)
        .fetch_one(pool.get_ref())
        .await?
    } else {
        sqlx::query_as("SELECT COUNT(*) FROM customers WHERE business_id = $1")
            .bind(business_id)
            .fetch_one(pool.get_ref())
            .await?
    };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": responses,
        "message": "Customers retrieved",
        "total": total.0
    })))
}

pub async fn get_customer(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let customer_id = path.into_inner();

    let customer: Option<Customer> = sqlx::query_as(
        "SELECT * FROM customers WHERE id = $1 AND business_id = $2"
    )
    .bind(customer_id)
    .bind(business_id)
    .fetch_optional(pool.get_ref())
    .await?;

    let customer = customer.ok_or_else(|| ApiError::NotFound("Customer not found".into()))?;

    // Get stats
    let stat: (Option<i64>, Option<f64>) = sqlx::query_as(
        "SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM transactions \
         WHERE customer_id = $1 AND status = 'success'"
    )
    .bind(customer_id)
    .fetch_one(pool.get_ref())
    .await?;

    let resp = CustomerResponse {
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        name: customer.name,
        metadata: customer.metadata,
        transaction_count: Some(stat.0.unwrap_or(0)),
        total_volume: Some(stat.1.unwrap_or(0.0)),
        created_at: customer.created_at,
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(resp, "Customer retrieved")))
}

pub async fn create_customer(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    body: web::Json<CreateCustomerRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;

    if body.email.is_none() && body.phone.is_none() {
        return Err(ApiError::BadRequest("Email or phone is required".into()));
    }

    // Check for existing customer by email
    if let Some(ref email) = body.email {
        let existing: Option<(Uuid,)> = sqlx::query_as(
            "SELECT id FROM customers WHERE business_id = $1 AND email = $2"
        )
        .bind(business_id)
        .bind(email)
        .fetch_optional(pool.get_ref())
        .await?;

        if existing.is_some() {
            return Err(ApiError::BadRequest("A customer with this email already exists".into()));
        }
    }

    let customer_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO customers (id, business_id, email, phone, name, metadata) \
         VALUES ($1, $2, $3, $4, $5, $6)"
    )
    .bind(customer_id)
    .bind(business_id)
    .bind(&body.email)
    .bind(&body.phone)
    .bind(&body.name)
    .bind(&body.metadata)
    .execute(pool.get_ref())
    .await?;

    let customer: Customer = sqlx::query_as(
        "SELECT * FROM customers WHERE id = $1"
    )
    .bind(customer_id)
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        CustomerResponse::from(customer),
        "Customer created",
    )))
}

pub async fn update_customer(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    jwt_secret: web::Data<String>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateCustomerRequest>,
) -> Result<HttpResponse, ApiError> {
    let claims = extract_dashboard_claims(&req, &jwt_secret)?;
    let business_id: Uuid = claims.business_id.parse()
        .map_err(|_| ApiError::Internal("Invalid business ID".into()))?;
    let customer_id = path.into_inner();

    let result = sqlx::query(
        "UPDATE customers SET \
         email = COALESCE($1, email), \
         phone = COALESCE($2, phone), \
         name = COALESCE($3, name), \
         metadata = COALESCE($4, metadata), \
         updated_at = NOW() \
         WHERE id = $5 AND business_id = $6"
    )
    .bind(&body.email)
    .bind(&body.phone)
    .bind(&body.name)
    .bind(&body.metadata)
    .bind(customer_id)
    .bind(business_id)
    .execute(pool.get_ref())
    .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound("Customer not found".into()));
    }

    let customer: Customer = sqlx::query_as(
        "SELECT * FROM customers WHERE id = $1"
    )
    .bind(customer_id)
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(
        CustomerResponse::from(customer),
        "Customer updated",
    )))
}
