import anthropic
from config.envvars import ANTHROPIC_API_KEY
from config.settings import QUESTIONNAIRE_QUESTIONS, MAX_CONVERSATION_HISTORY
from database.supabase import (
    get_conversation_history,
    save_message,
    save_questionnaire_response,
    update_patient_status,
)
from utils.storage import handle_media_upload
from integrations.whatsapp import send_message, send_typing

SYSTEM_PROMPT = """Sos un asistente médico amable y empático que hace el seguimiento del tratamiento de un paciente.

Paciente: {patient_name}
Medicamento: {drug_name}

Tu objetivo es cubrir estas 5 preguntas sobre el consumo del medicamento:
{questions}

Reglas:
- Si es el primer mensaje del paciente, presentate brevemente antes de la primera pregunta
- Sé empático, claro y conciso — el paciente está en WhatsApp, no en un formulario
- Si el paciente envía una imagen, audio u otro archivo, acusá recibo y consideralo en tu respuesta
- Podés hacer una breve pregunta de seguimiento si la respuesta es incompleta o poco clara
- No hagas más de una pregunta por mensaje
- Adaptá el tono y el lenguaje según las respuestas del paciente
- Respondé siempre en el mismo idioma que usa el paciente
- Cuando hayas cubierto las 5 preguntas principales, agradecé al paciente y despedite
- Al finalizar las 5 preguntas, incluí exactamente la etiqueta [COMPLETED] al final de tu último mensaje (el paciente no la verá)"""


def questionnaire_flow(record, patient):
    patient_id = patient["id"]
    phone = record["profile"]["phone_number"]
    msg_id = record.get("msg_id")

    send_typing(phone, msg_id)

    # Download media from WhatsApp → upload to Supabase Storage before URL expires
    media_url, media_type = None, None
    media_id = _get_media_id(record)
    if media_id:
        media_url, media_type = handle_media_upload(media_id, patient_id)

    text_content = record.get("text", "")

    save_message(
        patient_id=patient_id,
        direction="inbound",
        msg_type=record["type"],
        content=text_content,
        media_url=media_url,
        media_type=media_type,
        wa_msg_id=msg_id,
    )

    if patient["status"] in ("pending",):
        update_patient_status(patient_id, "in_progress")

    history = get_conversation_history(patient_id, limit=MAX_CONVERSATION_HISTORY)
    messages = _build_llm_messages(history, text_content, media_url)

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    questions_text = "\n".join([f"{i+1}. {q}" for i, q in enumerate(QUESTIONNAIRE_QUESTIONS)])
    system = SYSTEM_PROMPT.format(
        patient_name=patient["name"],
        drug_name=patient["drug_name"],
        questions=questions_text,
    )

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        system=system,
        messages=messages,
    )

    bot_reply_raw = response.content[0].text
    completed = "[COMPLETED]" in bot_reply_raw
    bot_reply = bot_reply_raw.replace("[COMPLETED]", "").strip()

    save_message(
        patient_id=patient_id,
        direction="outbound",
        msg_type="text",
        content=bot_reply,
        media_url=None,
        media_type=None,
        wa_msg_id=None,
    )

    question_number = _current_question_number(history)
    if text_content or media_url:
        save_questionnaire_response(
            patient_id=patient_id,
            question_number=question_number,
            answer_text=text_content,
            media_url=media_url,
        )

    send_message(bot_reply, phone)

    if completed:
        update_patient_status(patient_id, "completed")


def _get_media_id(record):
    for key in ("audio", "image", "video", "document"):
        media = record.get(key)
        if media:
            return media.get("id")
    return None


def _current_question_number(history):
    inbound_count = sum(1 for m in history if m["direction"] == "inbound")
    return min(inbound_count + 1, len(QUESTIONNAIRE_QUESTIONS))


def _build_llm_messages(history, current_text, media_url):
    messages = []
    for msg in history:
        role = "assistant" if msg["direction"] == "outbound" else "user"
        content = msg.get("content") or ""
        if msg.get("media_url"):
            content += f"\n[Archivo adjunto: {msg['media_url']}]"
        if content.strip():
            messages.append({"role": role, "content": content})

    current_content = current_text or ""
    if media_url:
        current_content += f"\n[Archivo adjunto: {media_url}]"
    if current_content.strip():
        messages.append({"role": "user", "content": current_content})

    # Claude requires conversation to start with 'user'
    if not messages or messages[0]["role"] != "user":
        messages = [{"role": "user", "content": "(inicio de conversación)"}] + messages

    return messages
