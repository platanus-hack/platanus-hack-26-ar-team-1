import requests, time
from config.envvars import WHATSAPP_TOKEN as TOKEN, WHATSAPP_PHONE as FROM_PHONE_NUMBER_ID
from config.settings import DOWNLOAD_TIMEOUT

# Kapso proxy — all WhatsApp API calls go through here with X-API-Key auth
KAPSO_BASE = "https://api.kapso.ai/meta/whatsapp/v24.0/"
META_BASE = "https://graph.facebook.com/v21.0/"   # only used for media download
TEXT_LENGTH_LIMIT = 4096


def get_file(file_id, max_retries=3, backoff_factor=2):
    url = KAPSO_BASE + file_id
    headers = {"X-API-Key": TOKEN}
    params = {"phone_number_id": FROM_PHONE_NUMBER_ID}
    for attempt in range(1, max_retries + 1):
        try:
            r = requests.get(url=url, headers=headers, params=params, timeout=DOWNLOAD_TIMEOUT)
            if r.ok:
                data = r.json()
                print(f"[get_file] {data}")
                return data
            print(f"[get_file attempt {attempt}] {r.status_code}: {r.text}")
        except requests.exceptions.RequestException as e:
            print(f"[get_file attempt {attempt}] {e}")
        if attempt < max_retries:
            time.sleep(backoff_factor ** (attempt - 1))
    return None


def download(url, max_retries=3, backoff_factor=2):
    for attempt in range(1, max_retries + 1):
        try:
            r = requests.get(url, headers={"X-API-Key": TOKEN}, timeout=DOWNLOAD_TIMEOUT)
            if r.ok:
                return r.content
            print(f"[download attempt {attempt}] {r.status_code}: {r.text[:200]}")
        except requests.exceptions.RequestException as e:
            print(f"[download attempt {attempt}] {e}")
        if attempt < max_retries:
            time.sleep(backoff_factor ** (attempt - 1))
    return None


def _post(url, payload, label, max_retries=3, backoff_factor=2):
    headers = {"X-API-Key": TOKEN}
    for attempt in range(1, max_retries + 1):
        try:
            r = requests.post(url, json=payload, headers=headers, timeout=DOWNLOAD_TIMEOUT)
            r.raise_for_status()
            return r
        except Exception as e:
            print(f"[{label} attempt {attempt}] {e}")
        if attempt < max_retries:
            time.sleep(backoff_factor ** (attempt - 1))
    raise Exception(f"Failed to send {label} after {max_retries} attempts")


def send_message(text, phone_number, reply_id=None):
    url = KAPSO_BASE + FROM_PHONE_NUMBER_ID + "/messages"
    if len(text) <= TEXT_LENGTH_LIMIT:
        _send_text(url, str(text), str(phone_number), reply_id)
        return
    parts = [text[i:i + TEXT_LENGTH_LIMIT - 12] for i in range(0, len(text), TEXT_LENGTH_LIMIT - 12)]
    for i, part in enumerate(parts, 1):
        _send_text(url, f"[{i}/{len(parts)}]\n{part}", str(phone_number), reply_id if i == 1 else None)


def _send_text(url, text, phone, reply_id):
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": text},
    }
    if reply_id:
        payload["context"] = {"message_id": reply_id}
    _post(url, payload, "message")


def send_buttons(body_text, buttons, phone_number):
    url = KAPSO_BASE + FROM_PHONE_NUMBER_ID + "/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": str(phone_number),
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body_text},
            "action": {"buttons": buttons},
        },
    }
    _post(url, payload, "buttons")


def send_typing(phone_number, msg_id):
    try:
        url = KAPSO_BASE + FROM_PHONE_NUMBER_ID + "/messages"
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": msg_id,
            "typing_indicator": {"type": "text"},
        }
        _post(url, payload, "typing")
    except Exception as e:
        print(f"Typing indicator failed (non-critical): {e}")
