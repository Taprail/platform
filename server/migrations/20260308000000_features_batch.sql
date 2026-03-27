-- =============================================================================
-- Feature batch: refunds, settlements, disputes, multi-currency,
-- idempotency, rate limiting, API key scopes, webhook response body,
-- email notifications, session expiry
-- =============================================================================

-- ===================== REFUNDS =====================
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    provider_reference TEXT,
    idempotency_key TEXT,
    environment TEXT NOT NULL DEFAULT 'test',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(idempotency_key, business_id)
);
CREATE INDEX idx_refunds_business ON refunds(business_id, created_at DESC);
CREATE INDEX idx_refunds_transaction ON refunds(transaction_id);

-- ===================== SETTLEMENTS =====================
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    amount DOUBLE PRECISION NOT NULL,
    fee_total DOUBLE PRECISION NOT NULL DEFAULT 0,
    net_amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    reference TEXT,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    transaction_count INT NOT NULL DEFAULT 0,
    environment TEXT NOT NULL DEFAULT 'test',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_settlements_business ON settlements(business_id, created_at DESC);

CREATE TABLE settlement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    amount DOUBLE PRECISION NOT NULL,
    fee DOUBLE PRECISION NOT NULL
);
CREATE INDEX idx_settlement_items_settlement ON settlement_items(settlement_id);

-- Bank accounts for payouts
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

-- ===================== DISPUTES =====================
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'under_review', 'won', 'lost', 'closed')),
    provider_dispute_id TEXT,
    evidence TEXT,
    due_date TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    environment TEXT NOT NULL DEFAULT 'test',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_disputes_business ON disputes(business_id, created_at DESC);
CREATE INDEX idx_disputes_transaction ON disputes(transaction_id);

-- ===================== IDEMPOTENCY KEYS =====================
CREATE TABLE idempotency_keys (
    key TEXT NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id),
    endpoint TEXT NOT NULL,
    response_status INT NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    PRIMARY KEY (key, business_id)
);
CREATE INDEX idx_idempotency_expiry ON idempotency_keys(expires_at);

-- ===================== RATE LIMITING =====================
CREATE TABLE rate_limit_buckets (
    key TEXT NOT NULL,
    tokens INT NOT NULL,
    last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (key)
);

-- ===================== API KEY SCOPES =====================
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT '{read,write}';

-- ===================== MULTI-CURRENCY =====================
CREATE TABLE supported_currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    minor_unit INT NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO supported_currencies (code, name, symbol, minor_unit) VALUES
    ('NGN', 'Nigerian Naira', '₦', 2),
    ('USD', 'US Dollar', '$', 2),
    ('GBP', 'British Pound', '£', 2),
    ('EUR', 'Euro', '€', 2),
    ('GHS', 'Ghanaian Cedi', 'GH₵', 2),
    ('KES', 'Kenyan Shilling', 'KSh', 2),
    ('ZAR', 'South African Rand', 'R', 2)
ON CONFLICT DO NOTHING;

-- Add currency to tables that were hardcoded
ALTER TABLE refunds ALTER COLUMN currency SET DEFAULT 'NGN';
ALTER TABLE settlements ALTER COLUMN currency SET DEFAULT 'NGN';

-- ===================== WEBHOOK DELIVERY RESPONSE BODY =====================
ALTER TABLE webhook_deliveries ADD COLUMN IF NOT EXISTS last_response_body TEXT;

-- ===================== EMAIL NOTIFICATIONS =====================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    email_payment_success BOOLEAN NOT NULL DEFAULT TRUE,
    email_payment_failed BOOLEAN NOT NULL DEFAULT TRUE,
    email_refund BOOLEAN NOT NULL DEFAULT TRUE,
    email_dispute BOOLEAN NOT NULL DEFAULT TRUE,
    email_settlement BOOLEAN NOT NULL DEFAULT TRUE,
    email_kyb_update BOOLEAN NOT NULL DEFAULT FALSE,
    email_weekly_summary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, member_id)
);

CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    recipient TEXT NOT NULL,
    template TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'sent', 'failed')),
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);
CREATE INDEX idx_email_logs_business ON email_logs(business_id, created_at DESC);

-- ===================== TRANSACTION REFUND TRACKING =====================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS refunded_amount DOUBLE PRECISION NOT NULL DEFAULT 0;
