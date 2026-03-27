-- Add ISW identity verification result fields to kyb_submissions
ALTER TABLE kyb_submissions ADD COLUMN bvn_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE kyb_submissions ADD COLUMN bvn_verification_ref TEXT;
ALTER TABLE kyb_submissions ADD COLUMN bvn_failure_reason TEXT;
ALTER TABLE kyb_submissions ADD COLUMN aml_status TEXT;
ALTER TABLE kyb_submissions ADD COLUMN aml_failure_reason TEXT;
ALTER TABLE kyb_submissions ADD COLUMN verification_raw_response JSONB;
