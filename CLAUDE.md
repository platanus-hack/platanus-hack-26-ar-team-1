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
                    │         CRO Agent               │
                    │  POST /report/generate          │
                    │  aggregates patients → report   │
                    └──┬───────────────┬──────────────┘
                       │               │
          ┌────────────▼───┐   ┌───────▼──────────┐
          │  mcd-doctor    │   │  WhatsApp Bot    │
          │  (Next.js)     │   │  ← THIS MODULE   │
          │  CRUD patients │   │  multi-agent     │
          │  sees status   │   │  questionnaire   │
          └────────────────┘   └──────────────────┘
                                        │
                    ┌───────────────────▼─────────────┐
                    │    mcd-dashboard (Lovable)       │
                    │    Lab reports + cohort view     │
                    └─────────────────────────────────┘
```

---

## Services & Deploy URLs

| Service | Branch | URL | Notes |
|---|---|---|---|
| WhatsApp Bot | `main` | `https://platanus-hack-26-ar-team-1-production.up.railway.app` | Flask + Waitress, full AI agents |
| WhatsApp Bot (demo) | `mcd-demo` | TBD (new Railway service) | Hardcoded dialog, no agents |
| Doctor dashboard | `main` | `https://mcd-doctor-production.up.railway.app` | Next.js, patient CRUD |
| Lab dashboard | — | `https://cohort-care-preview.lovable.app/` | Lovable, external team |

---

## What the Bot Does

1. Doctor loads patient (name, phone, drug) via mcd-doctor → DB status = `pending`
2. Patient messages the bot → questionnaire begins
3. Bot conducts dynamic AI interview (symptom agent + image agent)
4. Responses, symptoms, image analyses saved to Supabase
5. After ≥3 exchanges and all areas covered → status = `completed`
6. If no reply after 48h → status = `non_responsive` (flagged RED)

---

## Stack

| Layer | Technology |
|---|---|
| Bot runtime | Python (Flask + Waitress) on Railway |
| WhatsApp connectivity | Kapso proxy + Meta Graph API |
| Database | Supabase (PostgreSQL) |
| Media storage | Supabase Storage (`media` bucket, public) |
| LLM | Claude API — `claude-sonnet-4-6` |
| Doctor dashboard | Next.js on Railway (`mcd-doctor/`) |
| Lab reports dashboard | Lovable React app (`mcd-dashboard/`) |

---

## Architecture

### Bot service (`mcd/`) — single Railway service

**Webhook flow:**
1. Kapso sends `POST /webhook` with Kapso v2 payload
2. HMAC-SHA256 signature validated (header: `X-Webhook-Signature`)
3. 200 returned immediately; message processed in background thread
4. `parse_body()` extracts message from Kapso v2 envelope
5. Patient looked up by phone number
6. `questionnaire_flow()` orchestrates agents (or `demo_flow()` on `mcd-demo` branch)

**Multi-agent questionnaire pipeline (per message):**
```
inbound message
    ↓
[upload media → Supabase Storage if image/audio/video]
    ↓
[Image Agent] ← only if message type is image
    Claude Vision + Ozempic visual knowledge
    structured output: observations, relevant_signals, alert_level
    ↓
[Symptom Agent] ← always
    Ozempic clinical knowledge base
    extracts: symptoms (category, severity, patient_quote)
    computes: adherence_signal, overall_alert_level, multimedia_requested
    generates: next_message (dynamic, not hardcoded)
    critical path: suicide/self-harm keywords → immediate escalation
    ↓
[save to DB] analysis JSONB → conversations, symptom_notes → questionnaire_responses
    ↓
[send reply via Kapso]
```

**CRO Agent** (`/report/generate`) — TODO:
- Aggregates all completed patients for a drug
- Generates cohort report (adherence rate, side effects, alerts, per-patient summaries)
- Saves to `lab_reports`, returns JSON for dashboard

### Demo flow (`mcd-demo` branch)

Hardcoded 6-step dialog for demos — no agents, no DB writes, in-memory state per phone:

| Step | Trigger | Bot sends |
|---|---|---|
| 0 | Any message | Welcome + "¿ya iniciaste tu tratamiento?" |
| 1 | Any message | "Buenísimo… mandame foto de tu rostro" |
| 2 | Image | "Qué bueno saberlo…" → 5s → ⏰ "3 dias después…" → foto request |
| 3 | Image | 3 confounding factor questions |
| 4 | Any text | "Gracias!" → 5s → ⏰ "14 dias despues…" |
| 5 | Image + text | "Lamento que te sientas así… Dr. Platanus" → loop to 0 |

`RESTART` silently resets state to step 0 without sending any message.

---

## Patient State Machine

```
pending
  ├── [patient messages bot]  → in_progress
  │     └── [≥3 exchanges, all areas covered] → completed
  └── [48h no contact]        → non_responsive  ← RED
```

---

## Agents

### Image Agent (`agents/image_agent.py`)
- **Input**: Supabase Storage public URL + patient dict
- **Knowledge**: Ozempic visual signals (Ozempic Face, injection site reactions, jaundice, dehydration)
- **Tool**: `report_image_findings` — structured output with `observations[]`, `relevant_signals[]`, `alert_level`, `request_followup`
- **Fallback**: base64 encoding if URL source fails

### Symptom Agent (`agents/symptom_agent.py`)
- **Input**: conversation history + latest message text + image_analysis dict (if any) + questions_so_far count
- **Knowledge**: full Ozempic clinical knowledge — GI effects, mood changes, hair loss, voice changes, hypoglycemia, injection reactions
- **Tool**: `process_and_next` — structured output with `symptoms_noted[]` (symptom, category, severity, patient_quote), `adherence_signal`, `overall_alert_level`, `multimedia_requested[]`, `confounding_factors[]`, `is_complete`, `next_message`
- **Fast path**: critical keyword check before API call (suicide/self-harm → immediate escalation message, mark complete, alert)
- **Multimedia triggers**: keyword-based pre-check hints the model to request photos/audio

### Knowledge Base (`agents/knowledge/ozempic_knowledge.py`)
Shared between agents. Contains:
- `SYMPTOM_KNOWLEDGE` — clinical guide for symptom agent
- `IMAGE_KNOWLEDGE` — visual analysis guide for image agent
- `CRITICAL_ALERT_KEYWORDS` — suicide/self-harm fast path
- `HIGH_ALERT_KEYWORDS` — urgent clinical signals
- `MULTIMEDIA_TRIGGER_KEYWORDS` — when to request photos/audio

---

## Database Schema

| Table | Key columns |
|---|---|
| `patients` | id, name, phone_number, drug_name, status, adherence_overall, clinical_summary, clinical_flags, contact_attempts, last_contact_at |
| `conversations` | id, patient_id, direction, message_type, content, media_url, analysis (JSONB), bot_response, image_analysis |
| `questionnaire_responses` | id, patient_id, question_number, answer_text, symptom_notes, adherence_signal, media_url |
| `lab_reports` | id, drug_name, doctor_id, report_json (JSONB), generated_at |

The `conversations.analysis` JSONB stores the full structured output from both agents per inbound message:
```json
{
  "symptoms_noted": [{"symptom": "...", "category": "...", "severity": "...", "patient_quote": "..."}],
  "adherence_signal": "high|medium|low|unclear",
  "overall_alert_level": "ninguna|baja|moderada|alta|urgente",
  "multimedia_requested": [],
  "confounding_factors": [],
  "is_complete": false,
  "image_analysis": { "observations": [], "relevant_signals": [], "alert_level": "..." }
}
```

---

## Environment Variables

```
WHATSAPP_TOKEN=              # Kapso API key (used as X-API-Key header)
WHATSAPP_PHONE=              # Kapso phone_number_id: 1086169867919187
WHATSAPP_WEBHOOK_SECRET=     # Kapso webhook secret (HMAC key)
SUPABASE_URL=                # https://jrjakjwwliwsktmostby.supabase.co
SUPABASE_SERVICE_ROLE_KEY=   # Supabase service role key
ANTHROPIC_API_KEY=           # Claude API key
ENVIRONMENT=                 # prod
```

All env vars required on both `mcd` and `mcd-demo` Railway services.

---

## Kapso Setup (done)

- Project: **MCD** (`265dd2fe-a7ba-44fe-9299-0c3ddbd67b57`)
- Production number: **+1 201-701-6560** — `phone_number_id: 1086169867919187`
- Webhook ID: `5f30448b-dde5-4fc1-9271-6cdffc74b65e`
  - Event: `whatsapp.message.received`, payload v2, active
  - Points to whichever service is active (switch with command below)

**Switch webhook between services:**
```bash
kapso whatsapp webhooks update 5f30448b-dde5-4fc1-9271-6cdffc74b65e --phone-number-id 1086169867919187 --url <url>/webhook
```

---

## Deployment

- **Local dev**: `set -a && source .env && set +a && .venv/bin/python -m flask run --port 5000` + `ngrok http 5000`
- **Production (main)**: `railway up --detach` from `mcd/`
- **Production (demo)**: deploy `mcd-demo` branch as a separate Railway service, same root dir `mcd/`, same env vars
- **Update Kapso webhook** after switching: run command above with the target service URL

---

## Project Structure

```
platanus-hack-26-ar-team-1/
├── mcd/                               # WhatsApp bot (Python/Flask)
│   ├── app.py                         # Flask app, webhook, admin endpoints
│   ├── core.py                        # parse_body(), handle_message()
│   ├── proactive.py                   # non_responsive flagging
│   ├── agents/
│   │   ├── image_agent.py             # Claude Vision analysis
│   │   ├── symptom_agent.py           # Text analysis + next question generation
│   │   ├── cro_agent.py               # ← TODO: cohort report generation
│   │   └── knowledge/
│   │       └── ozempic_knowledge.py   # Shared clinical knowledge base
│   ├── flows/
│   │   ├── questionnaire_flow.py      # Orchestrates image + symptom agents (main)
│   │   └── demo_flow.py               # Hardcoded dialog, no agents (mcd-demo branch)
│   ├── database/
│   │   └── supabase.py                # All DB operations
│   ├── integrations/
│   │   └── whatsapp.py                # Kapso API calls (send, download, get_file)
│   ├── utils/
│   │   └── storage.py                 # Media upload to Supabase Storage
│   ├── config/
│   │   ├── envvars.py
│   │   └── settings.py
│   ├── db/
│   │   └── schema.sql                 # Reference only — schema already applied
│   ├── Procfile
│   ├── railway.toml
│   └── requirements.txt
├── mcd-doctor/                        # Doctor dashboard (Next.js on Railway)
│   └── src/app/
│       ├── api/patients/              # CRUD patients
│       ├── api/auth/                  # Doctor login
│       └── patients/page.tsx          # Patient list UI
├── mcd-dashboard/                     # Lab reports dashboard (Lovable/React)
├── project-logo.png                   # 1000x1000 submission logo
├── project-description.md            # Submission description
├── platanus-hack-project.json         # Submission metadata
└── CLAUDE.md                          # This file
```
