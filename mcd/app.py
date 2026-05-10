import os, hmac, hashlib, threading, json
from flask import Flask, request, jsonify
from config.envvars import ADMIN_API_TOKEN, WHATSAPP_WEBHOOK_SECRET
from core import parse_body, handle_message

app = Flask(__name__)


# ── Webhook verification (Meta sends a GET when you register the webhook URL) ──

@app.route("/webhook", methods=["GET"])
def webhook_verify():
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")
    if (
        mode == "subscribe"
        and WHATSAPP_WEBHOOK_SECRET
        and token
        and hmac.compare_digest(token, WHATSAPP_WEBHOOK_SECRET)
    ):
        return challenge, 200
    return "Forbidden", 403


# ── Inbound messages ──────────────────────────────────────────────────────────

@app.route("/webhook", methods=["POST"])
def webhook():
    if not _valid_signature(request.data, request.headers.get("X-Webhook-Signature", "")):
        return "Unauthorized", 401

    body = request.get_json(silent=True) or {}

    # Return 200 immediately — WhatsApp drops connection after 15s
    thread = threading.Thread(target=_process, args=(body,), daemon=True)
    thread.start()

    return "ok", 200


def _process(body):
    try:
        messages = parse_body(body)
        print(f"Webhook received: messages={len(messages)}", flush=True)
        for message in messages:
            handle_message(message)
    except Exception:
        print("Processing error", flush=True)


def _valid_signature(payload: bytes, header: str) -> bool:
    if not WHATSAPP_WEBHOOK_SECRET or not header:
        return False
    expected = hmac.new(
        WHATSAPP_WEBHOOK_SECRET.encode(),
        msg=payload,
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(header, expected)


# ── Admin endpoints (no dashboard yet — use curl for demo) ───────────────────

def _admin_authorized() -> bool:
    if not ADMIN_API_TOKEN:
        return False
    header = request.headers.get("X-Admin-Token", "")
    bearer = request.headers.get("Authorization", "")
    token = bearer.removeprefix("Bearer ").strip() if bearer.startswith("Bearer ") else header
    return hmac.compare_digest(token, ADMIN_API_TOKEN)


def _require_admin():
    if not ADMIN_API_TOKEN:
        return jsonify({"error": "admin API token is not configured"}), 503
    if not _admin_authorized():
        return jsonify({"error": "unauthorized"}), 401
    return None


@app.route("/admin/patient", methods=["POST"])
def admin_add_patient():
    """Add a patient for a doctor. Body: {name, phone_number, drug_name, doctor_id (optional)}"""
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    phone = data.get("phone_number", "").replace("+", "").replace(" ", "")
    drug = data.get("drug_name", "").strip()
    if not name or not phone or not drug:
        return jsonify({"error": "name, phone_number, drug_name required"}), 400
    from database.supabase import _db
    row = {"name": name, "phone_number": phone, "drug_name": drug, "status": "pending"}
    if data.get("doctor_id"):
        row["doctor_id"] = data["doctor_id"]
    result = _db().table("patients").insert(row).execute()
    return jsonify(result.data[0] if result.data else {}), 201


@app.route("/admin/patients", methods=["GET"])
def admin_list_patients():
    """List all patients with their status."""
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    from database.supabase import _db
    result = _db().table("patients").select("id, name, phone_number, drug_name, status, created_at").order("created_at", desc=True).execute()
    return jsonify(result.data or [])


@app.route("/health")
def health():
    return "ok"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
