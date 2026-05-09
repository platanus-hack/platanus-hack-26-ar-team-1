# MCD — Action Plan (Hackathon Day 2)

## Current state

- [x] Full Flask app scaffolded (`mcd/`) — webhook, questionnaire flow, proactive check, DB layer, storage
- [x] DB schema written (`mcd/db/schema.sql`)
- [x] Supabase project exists (`jrjakjwwliwsktmostby`)
- [x] Supabase MCP connected (new session needed to activate tools)
- [ ] `.env` filled with real credentials (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + ANTHROPIC_API_KEY missing)
- [ ] Schema run in Supabase
- [ ] Storage bucket created
- [ ] Railway deployed
- [x] Kapso webhook configured (`whatsapp.message.received` → Railway URL, secret set)

---

## Time budget

| Block | Time | Goal |
|---|---|---|
| Morning | 09:00–12:00 | Bot live on real WhatsApp end-to-end |
| Midday | 12:00–15:00 | CRO processing endpoint + lab report |
| Afternoon | 15:00–18:00 | Doctor dashboard |
| Evening | 18:00–EOD | Polish, full flow test, demo prep |

---

## Phase 0 — Infrastructure (first 30 min)

Do these in parallel:

### 1. Fill `.env`
Open `mcd/.env` and fill in all values:
```
WHATSAPP_TOKEN=          # Meta Graph API token — from Kapso dashboard
WHATSAPP_PHONE=          # Phone number ID — kapso whatsapp numbers list --output json
WHATSAPP_WEBHOOK_SECRET= # Any string you choose — used as webhook verify token too
SUPABASE_URL=            https://jrjakjwwliwsktmostby.supabase.co
SUPABASE_SERVICE_ROLE_KEY= # Supabase → Settings → API → service_role key
ANTHROPIC_API_KEY=       # your key
ENVIRONMENT=prod
```

### 2. Run DB schema (via Supabase MCP in new session, or manually)
Supabase dashboard → SQL Editor → paste and run `mcd/db/schema.sql`.
Creates: `doctors`, `patients`, `conversations`, `questionnaire_responses`, `lab_reports`.

### 3. Create Storage bucket
Supabase → Storage → New bucket → name: `media` → toggle **Public** → Create.

### 4. Deploy to Railway
```bash
cd platanus-hack-26-ar-team-1/mcd
railway login
railway init          # new project, name: mcd
railway up
```
Then in Railway dashboard → Variables → paste all 7 env vars.

### 5. Configure Kapso webhook
Set webhook URL to: `https://<railway-url>/webhook`
Verify token = the value you set for `WHATSAPP_WEBHOOK_SECRET`.

**Checkpoint:** `GET https://<railway-url>/health` returns `ok`. Kapso webhook verified green.

---

## Phase 1 — Smoke test end-to-end (09:00–12:00)

### Seed a test patient
```bash
curl -X POST https://<railway-url>/admin/patient \
  -H "Content-Type: application/json" \
  -d '{"name":"Paciente Test","phone_number":"5491112345678","drug_name":"Metformina"}'
```
Use a real phone number you have access to.

### Test the flow
1. Send "Hola" from that phone to the WhatsApp number
2. Bot should reply with intro + first question
3. Go through all 5 questions
4. Verify `status = completed` via `GET https://<railway-url>/admin/patients`
5. Send a photo during the questionnaire → verify it appears in Supabase Storage

### Test non-responsive flagging
Insert a patient with `created_at` backdated 49+ hours in Supabase SQL editor:
```sql
INSERT INTO patients (name, phone_number, drug_name, created_at)
VALUES ('Non Responsive', '5490000000001', 'Ibuprofeno', NOW() - INTERVAL '50 hours');
```
Wait for the hourly proactive check (or restart Railway to trigger it at startup — or call `run_proactive_check()` directly).

**Checkpoint:** Full questionnaire works on real WhatsApp. Status transitions correct. Non-responsive logic fires.

---

## Phase 2 — CRO Processing Endpoint (12:00–15:00)

Add a `/report/generate` endpoint to `app.py` that:
1. Takes `drug_name` (and optionally `doctor_id`) in the request body
2. Reads all `questionnaire_responses` for completed patients on that drug
3. Sends cohort data to Claude with a structured output prompt
4. Saves result to `lab_reports` table
5. Returns the report JSON

### Report JSON shape
```json
{
  "adherence_rate": 0.75,
  "key_findings": ["75% tomaron el medicamento correctamente", "30% reportó náuseas leves"],
  "side_effects_mentioned": ["náuseas", "mareos"],
  "patients": [
    {
      "patient_id": "...",
      "name": "...",
      "status": "completed",
      "adherence_signal": "high|medium|low",
      "summary": "Tomó el medicamento todos los días, reportó náuseas leves.",
      "flags": []
    }
  ],
  "non_responsive_patients": ["nombre1", "nombre2"],
  "recommended_actions": ["Seguimiento con pacientes que reportaron efectos secundarios"]
}
```

**Checkpoint:** `POST /report/generate` with `{"drug_name":"Metformina"}` returns valid JSON report.

---

## Phase 3 — Doctor Dashboard (15:00–18:00)

Single-file `dashboard/index.html` with Supabase JS via CDN. No framework, no build step.

**What it shows:**
- Patient list with green (completed) / red (non_responsive) / yellow (in_progress) / gray (pending) badges
- Drug name and created date per patient
- "Add patient" form (name, phone, drug)
- "Generate report" button → calls `/report/generate` → shows report inline

**Deploy:** Vercel (`vercel --prod` from `dashboard/`) — 2 minutes.

---

## Phase 4 — Polish + Demo Prep (18:00–EOD)

- [ ] Run full flow end-to-end: add patient → bot contacts → questionnaire → report generated
- [ ] Seed 3-4 patients with varied statuses for visual impact in dashboard
- [ ] Screenshot or record the WhatsApp conversation as backup for live demo
- [ ] Prepare 2-minute demo script:
  1. Show dashboard (patients list, status colors)
  2. Add a new patient live
  3. Open WhatsApp — bot message already waiting
  4. Go through 2-3 questions live
  5. Hit "Generate report" → show cohort analysis
  6. "This replaces a CRO that takes 3 months and costs $200K"

---

## Team split

| Who | Focus |
|---|---|
| Martín | Railway deploy, Kapso config, Phase 2 processing endpoint |
| Delfina | Phase 3 dashboard (HTML + Supabase JS) |
| Candela | Finalize questionnaire questions in `mcd/config/settings.py`, test as "patient", define report JSON shape |

---

## Watch-outs

1. **WhatsApp 24h window** — patients must message the bot first. Proactive outbound texts without a prior message require Meta-approved templates (takes 24-48h). For the demo: have someone send "Hola" to open the window, then the bot conducts the questionnaire freely.

2. **Railway cold starts** — first request after inactivity may be slow. `/health` ping keeps it warm.

3. **Phone number format** — DB stores without `+`. WhatsApp webhook sends without `+`. Both sides normalized already.

4. **Supabase MCP** — restart Claude Code session after adding the MCP entry so the tools are loaded. Then you can run SQL and insert seed data directly from the conversation.

5. **Demo data** — seed at least one `non_responsive` patient manually before the demo for visual contrast.
