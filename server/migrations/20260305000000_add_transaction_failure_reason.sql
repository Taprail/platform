-- Add failure tracking and provider reference to transactions
ALTER TABLE transactions ADD COLUMN failure_reason TEXT;
ALTER TABLE transactions ADD COLUMN provider_reference TEXT;
