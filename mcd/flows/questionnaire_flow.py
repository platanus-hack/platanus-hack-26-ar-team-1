from agents.image_agent import analyze_image
from agents.symptom_agent import analyze_and_next
from database.supabase import (
    complete_patient,
    get_conversation_history,
    get_question_count,
    save_message,
    save_questionnaire_response,
    update_patient_status,
)
from utils.storage import handle_media_upload
from integrations.whatsapp import send_message, send_typing

MIN_QUESTIONS_TO_COMPLETE = 3


def questionnaire_flow(record, patient):
    patient_id = patient["id"]
    phone = record["profile"]["phone_number"]
    msg_id = record.get("msg_id")

    send_typing(phone, msg_id)

    # --- Upload media before WhatsApp URL expires ---
    media_url, media_type = None, None
    media_id = _get_media_id(record)
    if media_id:
        media_url, media_type = handle_media_upload(media_id, patient_id)

    if not media_type:
        media_type = "text"

    text_content = record.get("text", "")

    if patient["status"] == "pending":
        update_patient_status(patient_id, "in_progress")

    # --- Image agent first, then symptom agent gets its output ---
    image_analysis = None
    if record["type"] == "image" and media_url:
        try:
            image_analysis = analyze_image(media_url, patient)
            print("[image_agent] completed")
        except Exception as e:
            print(f"[image_agent error] {e}")

    # --- Symptom agent: receives image_analysis when available ---
    history = get_conversation_history(patient_id)
    questions_so_far = get_question_count(patient_id)

    result = analyze_and_next(
        patient=patient,
        conversation_history=history,
        latest_message=text_content,
        image_analysis=image_analysis,
        questions_so_far=questions_so_far,
    )
    print(
        "[symptom_agent] "
        f"alert={result.get('overall_alert_level')} "
        f"complete={result.get('is_complete')} "
        f"symptoms={len(result.get('symptoms_noted', []))}"
    )

    bot_reply = result["next_message"]

    # --- Build unified analysis from both agents ---
    analysis = {
        "symptoms_noted":     result.get("symptoms_noted", []),
        "adherence_signal":   result.get("adherence_signal"),
        "overall_alert_level": result.get("overall_alert_level"),
        "multimedia_requested": result.get("multimedia_requested", []),
        "confounding_factors": result.get("confounding_factors", []),
        "is_complete":        result.get("is_complete", False),
    }
    if image_analysis:
        analysis["image_analysis"] = image_analysis

    # --- Save inbound with full analysis and bot_response in one write ---
    save_message(
        patient_id=patient_id,
        direction="inbound",
        msg_type=record["type"],
        content=text_content,
        media_url=media_url,
        media_type=media_type,
        wa_msg_id=msg_id,
        analysis=analysis,
        bot_response=bot_reply,
    )

    # symptoms_noted is a list of dicts — extract names for plain-text fields
    symptom_names = [s["symptom"] for s in result.get("symptoms_noted", []) if isinstance(s, dict)]

    # --- Persist questionnaire response ---
    save_questionnaire_response(
        patient_id=patient_id,
        question_number=questions_so_far + 1,
        answer_text=text_content or "[imagen]",
        media_url=media_url,
        symptom_notes=", ".join(symptom_names) or None,
        adherence_signal=result.get("adherence_signal"),
    )

    # --- Complete only if minimum questions answered ---
    if result.get("is_complete") and questions_so_far + 1 >= MIN_QUESTIONS_TO_COMPLETE:
        complete_patient(
            patient_id=patient_id,
            overall_adherence=result.get("adherence_signal", "unclear"),
            clinical_summary=", ".join(symptom_names),
            clinical_flags=[],
        )

    # --- Save outbound and send ---
    save_message(
        patient_id=patient_id,
        direction="outbound",
        msg_type="text",
        content=bot_reply,
        media_url=None,
        media_type="text",
        wa_msg_id=None,
    )
    send_message(bot_reply, phone)


def _get_media_id(record):
    for key in ("audio", "image", "video", "document"):
        media = record.get(key)
        if media:
            return media.get("id")
    return None
