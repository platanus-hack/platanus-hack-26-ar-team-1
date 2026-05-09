import uuid, time, json
from database.supabase import get_patient_by_phone
from flows.questionnaire_flow import questionnaire_flow
from integrations.whatsapp import send_message


def handle_message(record):
    if record["type"] == "ignore":
        return

    phone = record["profile"]["phone_number"]
    patient = get_patient_by_phone(phone)

    if patient is None:
        print(f"Unknown phone: {phone} — sending test reply")
        send_message("👋 Bot recibió tu mensaje. Pedile a tu médico que te cargue en el sistema.", phone)
        return

    if patient["status"] == "completed":
        send_message("¡Ya completaste el cuestionario! Muchas gracias por tu tiempo. 🙏", phone)
        return

    questionnaire_flow(record, patient)


def parse_body(body):
    if isinstance(body, str):
        body = json.loads(body)

    # Kapso v2 format: message at root
    if "message" in body:
        return [_parse_message(body["message"])]

    # Meta native format: entry[].changes[].value.messages[]
    results = []
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            for message in change.get("value", {}).get("messages", []):
                results.append(_parse_message(message))
    return results


def _parse_message(message):
    try:
        ts = int(message.get("timestamp"))
    except Exception:
        ts = int(time.time())

    r = {
        "call_id": str(uuid.uuid4()),
        "source": "w",
        "timestamp": ts,
        "user_id": message["from"],
        "msg_id": message.get("id"),
        "type": message.get("type", "unknown"),
        "text": message.get("text", {}).get("body", ""),
        "profile": {"phone_number": str(message["from"])},
        "audio": None,
        "image": None,
        "video": None,
        "document": None,
    }

    t = r["type"]
    if t == "audio":
        r["audio"] = {
            "id": message["audio"]["id"],
            "mimetype": message["audio"]["mime_type"],
            "voice": message["audio"].get("voice", False),
        }
    elif t == "image":
        r["image"] = {
            "id": message["image"]["id"],
            "mime_type": message["image"].get("mime_type", ""),
            "caption": message["image"].get("caption", ""),
        }
    elif t == "video":
        r["video"] = {
            "id": message["video"]["id"],
            "mimetype": message["video"].get("mime_type", ""),
        }
    elif t == "document":
        r["document"] = {
            "id": message["document"]["id"],
            "mime_type": message["document"].get("mime_type", ""),
            "filename": message["document"].get("filename", ""),
        }
    elif t in ("reaction", "unsupported"):
        r["type"] = "ignore"

    return r
