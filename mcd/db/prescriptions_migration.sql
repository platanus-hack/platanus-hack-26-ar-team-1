-- Run in Supabase SQL editor after schema.sql

CREATE TABLE prescriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    drug_name   VARCHAR NOT NULL,
    dosage      VARCHAR NOT NULL,
    frequency   VARCHAR NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
