-- Run once in the Supabase SQL editor

CREATE TABLE doctors (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR NOT NULL,
    email      VARCHAR UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patients (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id            UUID REFERENCES doctors(id),
    name                 VARCHAR NOT NULL,
    phone_number         VARCHAR NOT NULL UNIQUE,  -- no + or spaces
    drug_name            VARCHAR NOT NULL,
    status               VARCHAR NOT NULL DEFAULT 'pending',
    -- pending | in_progress | completed | non_responsive
    completed_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_phone  ON patients(phone_number);
CREATE INDEX idx_patients_status ON patients(status);

CREATE TABLE conversations (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id           UUID NOT NULL REFERENCES patients(id),
    direction            VARCHAR NOT NULL,  -- inbound | outbound
    message_type         VARCHAR NOT NULL,  -- text | audio | image | video | document
    content              TEXT,
    media_url            VARCHAR,           -- Supabase Storage public URL
    media_type           VARCHAR,
    whatsapp_message_id  VARCHAR,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_patient ON conversations(patient_id, created_at);

CREATE TABLE questionnaire_responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    question_number INTEGER NOT NULL,
    question_text   TEXT NOT NULL,
    answer_text     TEXT,
    media_url       VARCHAR,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lab_reports (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_name            VARCHAR NOT NULL,
    doctor_id            UUID REFERENCES doctors(id),
    generated_at         TIMESTAMPTZ DEFAULT NOW(),
    patient_count        INTEGER,
    completed_count      INTEGER,
    non_responsive_count INTEGER,
    report_json          JSONB
);

-- Supabase Storage: create a bucket called "media" in Storage → Buckets (set to public)
