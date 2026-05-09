# MCD — Project Context for Collaborators

## Full System Picture

MCD replaces CRO (Contract Research Organizations) for pharmaceutical labs. Labs traditionally pay CROs to collect patient data through slow fieldwork. MCD creates a direct data pipeline from multiple sources to the lab.

```
                    ┌─────────────────────────────────┐
                    │          LABORATORY              │
                    │  (pays doctor, wants adherence)  │
                    └───────────────┬─────────────────┘
                                    │ consumes
                    ┌───────────────▼─────────────────┐
                    │    Processing LLM / Analytics    │
                    │  (aggregates sources → reports)  │
                    └──┬───────────────┬──────────────┘
                       │               │
          ┌────────────▼───┐   ┌───────▼──────────┐
          │  Doctor input  │   │  WhatsApp Bot    │
          │  (dashboard,   │   │  ← THIS MODULE   │
          │  loads patients│   │  patient reports │
          │  sees status)  │   │  via AI interview│
          └────────────────┘   └──────────────────┘
```

**The WhatsApp bot is one data source** feeding the Processing LLM. The Processing LLM (Phase 2) is the core platform value — it ingests all sources and outputs structured intelligence for the lab. We are building the WhatsApp bot module in this hackathon.

---

## What the Bot Does

1. Doctor loads patient (name, phone, drug) into dashboard → DB status = `pending`
2. Proactive Lambda detects pending patients → sends WhatsApp message
3. Patient replies → Core Lambda conducts LLM-guided 5-question questionnaire
4. Responses (text + any media) saved to Supabase + S3
5. After questionnaire → status = `completed`
6. If no reply after 3 attempts in 2 days → status = `non_responsive` (shown RED to doctor/lab)

---

## Stack

| Layer | Technology |
|---|---|
| Bot runtime | Python on Railway |
| WhatsApp connectivity | Kapso (phone number + webhook forwarding) + Meta Graph API |
| Database | Supabase (PostgreSQL) |
| Media storage | Supabase Storage |
| LLM | Claude API (Anthropic) — `claude-sonnet-4-6` |
| Proactive scheduler | Railway cron service (every hour) |

---

## Architecture: Three Services

### Service 1 — Router (`mcd/router/`)
- Receives WhatsApp webhooks forwarded by Kapso
- Validates HMAC SHA256 signature (Meta security requirement)
- Returns 200 **immediately** — WhatsApp requires response within 15s
- Invokes Core service **asynchronously** (background task or queue)

### Service 2 — Core (`mcd/core/`)
- Parses incoming message (text, audio, image, video, document)
- Looks up patient by phone number in Supabase
- Downloads media from WhatsApp immediately (URLs expire in minutes) → uploads to Supabase Storage
- Runs questionnaire flow with Claude
- Saves all responses to Supabase
- Sends reply via WhatsApp API

### Service 3 — Proactive (`mcd/proactive/`)
- Railway cron fires every hour
- Queries Supabase for `status = pending` patients
- Sends outreach messages according to retry schedule
- Marks `non_responsive` when window is exhausted

---

## Patient State Machine

```
pending
  ├── [proactive sends msg] → contact_attempts++
  ├── [patient replies]     → in_progress
  │     └── [5 questions done] → completed
  └── [3 attempts, no reply in ~72h] → non_responsive  ← RED in dashboard
```

---

## Retry Logic

| Attempt | Trigger condition |
|---|---|
| 1st | `contact_attempts = 0` (patient just loaded) |
| 2nd | 24h after 1st, no reply |
| 3rd | 24h after 2nd, no reply |
| `non_responsive` | 24h after 3rd, still no reply |

Proactive service runs hourly and checks these conditions via `last_contact_at`.

---

## Questionnaire

5 questions defined in `core/config/settings.py` → `QUESTIONNAIRE_QUESTIONS`.

**Teammate responsible for questions:** update that list. The LLM uses them as a guide but adapts tone and follow-ups based on patient responses. System prompt is in `core/flows/questionnaire_flow.py`.

Completion signal: LLM includes `[COMPLETED]` in its response. The flow strips it before sending to the patient and sets status = `completed`.

---

## Media Handling

Patient sends image/audio/video/document → Core service:
1. Receives media `id` from WhatsApp webhook (not the file)
2. `GET graph.facebook.com/v21.0/{id}` → gets temporary download URL
3. Downloads bytes immediately
4. Uploads to Supabase Storage under `patients/{patient_id}/{timestamp}_{id}.ext`
5. Saves storage URL in `conversations` table
6. Passes URL as context to LLM

---

## Code Reused from TranscribeMe

| File | Source | Notes |
|---|---|---|
| `router/main.py` | TranscribeMe router | Stripped to WhatsApp-only |
| `router/whatsapp.py` | TranscribeMe router | Verbatim (HMAC validation) |
| `core/integrations/whatsapp.py` | TranscribeMe core | Verbatim (get_file, download, send_message, send_buttons, send_typing) |
| `core/main.py` | TranscribeMe core | Kept parse_body(), replaced all flow logic |

---

## Database Schema

See `db/schema.sql`. Run once in Supabase SQL editor.

| Table | Purpose |
|---|---|
| `doctors` | Doctor accounts |
| `patients` | One row per patient, holds status + retry tracking |
| `conversations` | Full message log per patient (inbound + outbound + media URLs) |
| `questionnaire_responses` | One row per question answered per patient |

---

## Environment Variables

### Router Service
```
WHATSAPP_WEBHOOK_SECRET=     # Meta webhook app secret (HMAC key)
WHATSAPP_PHONE_NUMBER_ID=    # Kapso phone number ID
CORE_SERVICE_URL=            # Internal URL of Core service on Railway
```

### Core Service
```
WHATSAPP_TOKEN=              # Meta Graph API access token
WHATSAPP_PHONE=              # Phone number ID (same as above)
SUPABASE_URL=                # https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=   # Supabase service role key (bypasses RLS)
SUPABASE_STORAGE_BUCKET=     # Supabase Storage bucket for media
ANTHROPIC_API_KEY=           # Claude API key
ENVIRONMENT=                 # dev | prod
```

### Proactive Service
```
WHATSAPP_TOKEN=
WHATSAPP_PHONE=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Kapso Setup (done)

- Project: **MCD** (`265dd2fe-a7ba-44fe-9299-0c3ddbd67b57`)
- Production number: **+1 201-701-6560** — `phone_number_id: 1086169867919187`
- Webhook: `whatsapp.message.received` → `https://platanus-hack-26-ar-team-1-production.up.railway.app/webhook`
  - Webhook ID: `5f30448b-dde5-4fc1-9271-6cdffc74b65e`
  - Payload version: v2, active
  - Secret key → set as `WHATSAPP_WEBHOOK_SECRET` in Railway env vars

---

## Phase 2 — Processing LLM (deferred, not MVP)

A second LLM ingests aggregated `questionnaire_responses` + other data sources and generates structured reports for the lab. This is the core platform differentiator vs CROs. Not built in this hackathon.

---

## Project Structure

```
mcd/
├── router/                        # Service 1 (Railway)
│   ├── main.py
│   ├── whatsapp.py
│   ├── integrations.py
│   └── requirements.txt
├── core/                          # Service 2 (Railway)
│   ├── main.py
│   ├── integrations/
│   │   └── whatsapp.py
│   ├── flows/
│   │   └── questionnaire_flow.py  # ← LLM questionnaire logic
│   ├── database/
│   │   └── supabase.py
│   ├── utils/
│   │   └── storage.py
│   └── config/
│       ├── envvars.py
│       └── settings.py            # ← QUESTIONNAIRE_QUESTIONS here
├── proactive/                     # Service 3 (Railway cron)
│   ├── main.py
│   └── requirements.txt
└── db/
    └── schema.sql                 # Run once in Supabase
```
