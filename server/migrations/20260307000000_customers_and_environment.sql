-- =============================================================================
-- Add customers table + environment tracking for test/live mode
-- =============================================================================

-- ===================== CUSTOMERS =====================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    name TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, email)
);
CREATE INDEX idx_customers_business ON customers(business_id, created_at DESC);
CREATE INDEX idx_customers_email ON customers(business_id, email);
CREATE INDEX idx_customers_phone ON customers(business_id, phone);

-- ===================== ENVIRONMENT TRACKING =====================
-- Add environment column to sessions and transactions
ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'test'
    CHECK (environment IN ('test', 'live'));

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'test'
    CHECK (environment IN ('test', 'live'));

-- Add customer_id FK to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

CREATE INDEX idx_txn_environment ON transactions(business_id, environment, created_at DESC);
CREATE INDEX idx_txn_customer ON transactions(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_sessions_environment ON payment_sessions(business_id, environment);
