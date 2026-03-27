use sqlx::PgPool;
use uuid::Uuid;

/// Email delivery service.
/// Currently logs emails to the database. In production, integrate with
/// an SMTP provider (e.g., Resend, Postmark, SES).
pub struct EmailService {
    from_address: String,
}

impl EmailService {
    pub fn new(from_address: String) -> Self {
        Self { from_address }
    }

    /// Queue an email for delivery. Returns the email log ID.
    pub async fn send(
        &self,
        pool: &PgPool,
        business_id: Uuid,
        recipient: &str,
        template: &str,
        subject: &str,
    ) -> Option<Uuid> {
        let id = Uuid::new_v4();
        let result = sqlx::query(
            "INSERT INTO email_logs (id, business_id, recipient, template, subject, status) \
             VALUES ($1, $2, $3, $4, $5, 'queued')"
        )
        .bind(id)
        .bind(business_id)
        .bind(recipient)
        .bind(template)
        .bind(subject)
        .execute(pool)
        .await;

        match result {
            Ok(_) => {
                log::info!(
                    "Email queued: id={}, to={}, template={}, subject={}",
                    id, recipient, template, subject
                );
                // TODO: Actually send the email via SMTP provider here.
                // For now, mark as sent immediately.
                let _ = sqlx::query(
                    "UPDATE email_logs SET status = 'sent', sent_at = NOW() WHERE id = $1"
                )
                .bind(id)
                .execute(pool)
                .await;
                Some(id)
            }
            Err(e) => {
                log::error!("Failed to queue email: {}", e);
                None
            }
        }
    }

    /// Send payment notification if the business member has it enabled.
    pub async fn notify_payment(
        &self,
        pool: &PgPool,
        business_id: Uuid,
        event: &str,
        amount: f64,
        currency: &str,
        reference: &str,
    ) {
        let template = match event {
            "success" => "payment_success",
            "failed" => "payment_failed",
            _ => return,
        };

        let subject = match event {
            "success" => format!("Payment received: {} {:.2}", currency, amount),
            "failed" => format!("Payment failed: {} {:.2}", currency, amount),
            _ => return,
        };

        let pref_column = match event {
            "success" => "email_payment_success",
            "failed" => "email_payment_failed",
            _ => return,
        };

        // Find team members who have this notification enabled
        let recipients: Vec<(String,)> = sqlx::query_as(&format!(
            "SELECT tm.email FROM notification_preferences np \
             JOIN team_members tm ON tm.id = np.member_id \
             WHERE np.business_id = $1 AND np.{} = TRUE",
            pref_column
        ))
        .bind(business_id)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        for (email,) in recipients {
            self.send(pool, business_id, &email, template, &subject).await;
        }
    }

    /// Send refund notification.
    pub async fn notify_refund(
        &self,
        pool: &PgPool,
        business_id: Uuid,
        amount: f64,
        currency: &str,
    ) {
        let subject = format!("Refund processed: {} {:.2}", currency, amount);

        let recipients: Vec<(String,)> = sqlx::query_as(
            "SELECT tm.email FROM notification_preferences np \
             JOIN team_members tm ON tm.id = np.member_id \
             WHERE np.business_id = $1 AND np.email_refund = TRUE"
        )
        .bind(business_id)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        for (email,) in recipients {
            self.send(pool, business_id, &email, "refund", &subject).await;
        }
    }

    /// Send dispute notification.
    pub async fn notify_dispute(
        &self,
        pool: &PgPool,
        business_id: Uuid,
        amount: f64,
        currency: &str,
        status: &str,
    ) {
        let subject = format!("Dispute {}: {} {:.2}", status, currency, amount);

        let recipients: Vec<(String,)> = sqlx::query_as(
            "SELECT tm.email FROM notification_preferences np \
             JOIN team_members tm ON tm.id = np.member_id \
             WHERE np.business_id = $1 AND np.email_dispute = TRUE"
        )
        .bind(business_id)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        for (email,) in recipients {
            self.send(pool, business_id, &email, "dispute", &subject).await;
        }
    }

    /// Send settlement notification.
    pub async fn notify_settlement(
        &self,
        pool: &PgPool,
        business_id: Uuid,
        amount: f64,
        currency: &str,
    ) {
        let subject = format!("Settlement completed: {} {:.2}", currency, amount);

        let recipients: Vec<(String,)> = sqlx::query_as(
            "SELECT tm.email FROM notification_preferences np \
             JOIN team_members tm ON tm.id = np.member_id \
             WHERE np.business_id = $1 AND np.email_settlement = TRUE"
        )
        .bind(business_id)
        .fetch_all(pool)
        .await
        .unwrap_or_default();

        for (email,) in recipients {
            self.send(pool, business_id, &email, "settlement", &subject).await;
        }
    }
}
