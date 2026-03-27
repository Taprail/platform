CREATE TABLE kyb_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'pending_review', 'approved', 'rejected')),
    registered_name TEXT,
    registration_number TEXT,
    business_type TEXT,
    business_address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'NG',
    date_of_incorporation TEXT,
    industry TEXT,
    website TEXT,
    description TEXT,
    director_full_name TEXT,
    director_email TEXT,
    director_phone TEXT,
    director_bvn TEXT,
    director_dob TEXT,
    director_address TEXT,
    director_nationality TEXT DEFAULT 'Nigerian',
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kyb_business ON kyb_submissions(business_id);
CREATE INDEX idx_kyb_status ON kyb_submissions(status);

CREATE TABLE kyb_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kyb_submission_id UUID NOT NULL REFERENCES kyb_submissions(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id),
    document_type TEXT NOT NULL
        CHECK (document_type IN ('cac_certificate', 'director_id', 'utility_bill', 'board_resolution', 'other')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded'
        CHECK (status IN ('uploaded', 'verified', 'rejected')),
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kyb_docs_submission ON kyb_documents(kyb_submission_id);

ALTER TABLE businesses ADD COLUMN kyb_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (kyb_status IN ('not_started', 'in_progress', 'pending_review', 'approved', 'rejected'));
