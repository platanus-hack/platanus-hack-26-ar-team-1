from supabase import create_client
from datetime import datetime, timezone
from config.envvars import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

_client = None


def _db():
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _client


def get_patient_by_phone(phone_number):
    normalized = phone_number.replace("+", "").replace(" ", "")
    result = (
        _db().table("patients")
        .select("*")
        .eq("phone_number", normalized)
        .maybe_single()
        .execute()
    )
    return result.data if result else None


def update_patient_status(patient_id, status):
    _db().table("patients").update({"status": status}).eq("id", patient_id).execute()


def save_message(patient_id, direction, msg_type, content, media_url, media_type, wa_msg_id, image_analysis=None):
    row = {
        "patient_id": patient_id,
        "direction": direction,
        "message_type": msg_type,
        "content": content,
        "media_url": media_url,
        "media_type": media_type,
        "whatsapp_message_id": wa_msg_id,
        "created_at": _now(),
    }
    if image_analysis:
        row["image_analysis"] = image_analysis
    row.pop("created_at", None)  # let DB DEFAULT NOW() handle it (ensures proper TIMESTAMPTZ)
    _db().table("conversations").insert(row).execute()


def get_conversation_history(patient_id, limit=20):
    result = (
        _db().table("conversations")
        .select("direction, message_type, content, media_url, created_at")
        .eq("patient_id", patient_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    return result.data or []


def get_question_count(patient_id):
    result = (
        _db().table("questionnaire_responses")
        .select("id", count="exact")
        .eq("patient_id", patient_id)
        .execute()
    )
    return result.count or 0


def save_questionnaire_response(patient_id, question_number, answer_text, media_url=None, symptom_notes=None, adherence_signal=None):
    row = {
        "patient_id": patient_id,
        "question_number": question_number,
        "question_text": "",
        "answer_text": answer_text,
        "media_url": media_url,
    }
    if symptom_notes:
        row["symptom_notes"] = symptom_notes
    if adherence_signal:
        row["adherence_signal"] = adherence_signal
    _db().table("questionnaire_responses").insert(row).execute()


def complete_patient(patient_id, overall_adherence, clinical_summary, clinical_flags):
    import json
    _db().table("patients").update({
        "status": "completed",
        "completed_at": _now(),
        "adherence_overall": overall_adherence,
        "clinical_summary": clinical_summary,
        "clinical_flags": json.dumps(clinical_flags),
    }).eq("id", patient_id).execute()


def get_patients_by_drug(drug_name):
    result = (
        _db().table("patients")
        .select("*, questionnaire_responses(*)")
        .eq("drug_name", drug_name)
        .execute()
    )
    return result.data or []


def save_lab_report(drug_name, doctor_id, patient_count, completed_count, non_responsive_count, report_json):
    _db().table("lab_reports").insert({
        "drug_name": drug_name,
        "doctor_id": doctor_id,
        "patient_count": patient_count,
        "completed_count": completed_count,
        "non_responsive_count": non_responsive_count,
        "report_json": report_json,
        "generated_at": _now(),
    }).execute()


def _now():
    return datetime.now(timezone.utc).isoformat()
