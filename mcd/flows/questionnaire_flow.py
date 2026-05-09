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

    text_content = record.get("text", "")
    image_analysis = None

    # --- Save inbound message ---
    save_message(
        patient_id=patient_id,
        direction="inbound",
        msg_type=record["type"],
        content=text_content,
        media_url=media_url,
        media_type=media_type,
        wa_msg_id=msg_id,
    )

    if patient["status"] == "pending":
        update_patient_status(patient_id, "in_progress")

    # --- Image agent: analyze if patient sent an image ---
    if record["type"] == "image" and media_url:
        try:
            image_analysis = analyze_image(media_url, patient)
            print(f"[image_agent] {image_analysis}")
            _save_image_analysis_to_last_message(patient_id, msg_id, image_analysis)
        except Exception as e:
            print(f"[image_agent error] {e}")

    # --- Symptom agent: extract findings and generate next question ---
    history = get_conversation_history(patient_id)
    questions_so_far = get_question_count(patient_id)

    result = analyze_and_next(
        patient=patient,
        conversation_history=history,
        latest_message=text_content,
        image_analysis=image_analysis,
        questions_so_far=questions_so_far,
    )
    print(f"[symptom_agent] {result}")

    # --- Persist this response ---
    save_questionnaire_response(
        patient_id=patient_id,
        question_number=questions_so_far + 1,
        answer_text=text_content or "[imagen]",
        media_url=media_url,
        symptom_notes=", ".join(result.get("symptoms_noted", [])) or None,
        adherence_signal=result.get("adherence_signal"),
    )

    bot_reply = result["next_message"]

    # --- Complete only if minimum questions answered ---
    if result.get("is_complete") and questions_so_far + 1 >= MIN_QUESTIONS_TO_COMPLETE:
        complete_patient(
            patient_id=patient_id,
            overall_adherence=result.get("adherence_signal", "unclear"),
            clinical_summary=", ".join(result.get("symptoms_noted", [])),
            clinical_flags=[],
        )

    # --- Save outbound and reply ---
    save_message(
        patient_id=patient_id,
        direction="outbound",
        msg_type="text",
        content=bot_reply,
        media_url=None,
        media_type=None,
        wa_msg_id=None,
    )
    send_message(bot_reply, phone)


def _get_media_id(record):
    for key in ("audio", "image", "video", "document"):
        media = record.get(key)
        if media:
            return media.get("id")
    return None


def _save_image_analysis_to_last_message(patient_id, wa_msg_id, analysis):
    from database.supabase import _db
    try:
        _db().table("conversations") \
            .update({"image_analysis": analysis}) \
            .eq("patient_id", patient_id) \
            .eq("whatsapp_message_id", wa_msg_id) \
            .execute()
    except Exception as e:
        print(f"[image_analysis save] {e}")
