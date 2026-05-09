# MCD — Action Plan (Current State)

## What's Done

| Component | Status | Notes |
|---|---|---|
| WhatsApp bot (Flask + Waitress) | ✅ Done | Railway deployed, Kapso v2 webhook, HMAC validation |
| Kapso webhook | ✅ Done | `5f30448b`, v2 payload, currently → ngrok (local dev) |
| Kapso v2 payload parsing | ✅ Done | `parse_body()` handles Kapso envelope format |
| Media download + upload | ✅ Done | Kapso `download_url`, Supabase Storage `media` bucket |
| Image Agent | ✅ Done | Claude Vision, Ozempic visual knowledge, structured tool output |
| Symptom Agent | ✅ Done | Ozempic clinical KB, symptom classification, alert levels, multimedia triggers, critical fast path |
| Knowledge base | ✅ Done | `ozempic_knowledge.py` — symptoms, image signals, alert keywords |
| DB schema + migrations | ✅ Done | All tables + analysis JSONB, symptom_notes, adherence_signal, clinical_flags |
| Supabase Storage | ✅ Done | `media` bucket (public) |
| Admin endpoints | ✅ Done | POST /admin/patient, GET /admin/patients |
| Proactive checker | ✅ Done | Flags non_responsive after 48h |
| Doctor CRUD app | ✅ Done | External app (separate team) |
| Lovable reports dashboard | ✅ Done | External app (separate team) — consumes `/report/generate` |

---

## What's Missing: CRO Agent

The only remaining piece. This is the endpoint the Lovable dashboard calls to generate lab reports.

### What it does

1. Receives `POST /report/generate` with `{ "drug_name": "Ozempic", "doctor_id": "..." }`
2. Queries all `completed` patients for that drug with their full data
3. Calls Claude with cohort data → structured report
4. Saves to `lab_reports` table
5. Returns the report JSON

### Report JSON shape (align with Lovable dashboard team)

```json
{
  "drug_name": "Ozempic",
  "generated_at": "2026-05-09T...",
  "cohort": {
    "total": 12,
    "completed": 9,
    "non_responsive": 2,
    "in_progress": 1,
    "adherence_rate": 0.78
  },
  "top_symptoms": [
    { "symptom": "Náuseas", "count": 6, "category": "esperado_ozempic", "avg_severity": "leve" }
  ],
  "alert_summary": {
    "urgente": 0,
    "alta": 1,
    "moderada": 3,
    "baja": 5
  },
  "image_findings": {
    "ozempic_face_detected": 2,
    "injection_reactions": 1
  },
  "patients": [
    {
      "patient_id": "...",
      "name": "...",
      "status": "completed",
      "adherence_signal": "high",
      "overall_alert_level": "baja",
      "symptoms": ["Náuseas leves", "Caída de cabello moderada"],
      "confounding_factors": [],
      "clinical_summary": "..."
    }
  ],
  "recommendations": [
    "Seguimiento con 3 pacientes que reportaron síntomas GI moderados",
    "Evaluar ajuste de dosis en paciente con alerta alta"
  ],
  "non_responsive_patients": ["Nombre Apellido", "..."]
}
```

---

## Action Plan: CRO Agent

### Step 1 — Create `agents/cro_agent.py`

```python
# Input: list of patients with their questionnaire_responses + conversations.analysis
# Output: structured cohort report dict (matches JSON shape above)
# Tool: generate_cohort_report with all fields required
```

Key decisions:
- Use `tool_choice: any` with a single `generate_cohort_report` tool for guaranteed structured output
- Pass all patient data as context (conversation.analysis JSONB has the rich structured data)
- Include Ozempic knowledge context so Claude can correctly categorize and prioritize

### Step 2 — Add DB query to `database/supabase.py`

```python
def get_completed_patients_with_responses(drug_name, doctor_id=None):
    # Joins patients + questionnaire_responses + conversations (analysis JSONB)
    # Returns everything the CRO agent needs in one call
```

### Step 3 — Add `/report/generate` endpoint to `app.py`

```python
@app.route("/report/generate", methods=["POST"])
def generate_report():
    drug_name = request.json.get("drug_name")
    doctor_id = request.json.get("doctor_id")
    # call CRO agent → save to lab_reports → return JSON
```

### Step 4 — Deploy to Railway

- `railway up --detach` from `mcd/`
- Update Kapso webhook back to Railway URL: `kapso whatsapp webhooks update 5f30448b-dde5-4fc1-9271-6cdffc74b65e --phone-number-id 1086169867919187 --url https://platanus-hack-26-ar-team-1-production.up.railway.app/webhook`

---

## Before Demo: Seed Data

Need realistic data to show in the dashboard. Use the admin API or SQL:

```sql
-- Add test patients in various states
INSERT INTO patients (name, phone_number, drug_name, status, adherence_overall, clinical_summary)
VALUES 
  ('Ana García', '5491123456789', 'Ozempic', 'completed', 'high', 'Buena adherencia. Náuseas leves en primeras semanas.'),
  ('Carlos López', '5491198765432', 'Ozempic', 'completed', 'medium', 'Olvidó 2 dosis. Reportó cansancio y caída de cabello.'),
  ('Laura Martínez', '5491111222333', 'Ozempic', 'non_responsive', null, null),
  ('Pedro Rodríguez', '5491144455566', 'Ozempic', 'in_progress', null, null);
```

---

## Demo Script (2 min)

1. Open Lovable dashboard → show patients list (green/red/yellow/gray)
2. Show a completed patient → expand symptoms and image analysis
3. Click "Generate Report" → show cohort analysis (adherence rate, top side effects)
4. Optional live: add new patient → send WhatsApp "Hola" → watch bot respond
5. Pitch: "This replaces a CRO that takes 3 months and costs $200K"

---

## Known Issues / Watch-outs

1. **Kapso webhook URL** — currently pointing at ngrok (local dev). Must update to Railway URL before demo: run the `kapso whatsapp webhooks update` command above.
2. **`conversations.image_analysis` column** — added but `save_message` doesn't write to it anymore (image_analysis now lives inside `conversations.analysis` JSONB). No action needed unless separate column matters.
3. **`drug_name` missing from patients info_schema query** — column IS in DB (inserts work), likely an ordinal listing gap in the query. Verified working.
4. **RAW BODY log** — `app.py` still logs the full raw body on every request. Remove before demo or it's noisy.
5. **`MIN_QUESTIONS_TO_COMPLETE = 3`** — can lower to 1-2 for demo speed if needed.
