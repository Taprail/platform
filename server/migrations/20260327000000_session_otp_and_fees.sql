-- Add OTP retry limit and fee consistency columns to payment_sessions
ALTER TABLE payment_sessions ADD COLUMN otp_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE payment_sessions ADD COLUMN computed_fee DOUBLE PRECISION;
ALTER TABLE payment_sessions ADD COLUMN computed_net_amount DOUBLE PRECISION;
