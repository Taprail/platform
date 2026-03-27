-- Add 'awaiting_otp' status and provider tracking to payment_sessions
ALTER TABLE payment_sessions DROP CONSTRAINT IF EXISTS payment_sessions_status_check;
ALTER TABLE payment_sessions ADD CONSTRAINT payment_sessions_status_check
    CHECK (status IN ('pending', 'locked', 'awaiting_otp', 'paid', 'expired', 'cancelled'));

-- Store ISW payment_id, transaction_ref, and encrypted authData for OTP validation
ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS provider_ref TEXT;
ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS encrypted_auth_data TEXT;
