import os, hmac, hashlib, threading, json
from flask import Flask, request, jsonify
from config.envvars import WHATSAPP_WEBHOOK_SECRET
from core import parse_body, handle_message

app = Flask(__name__)


# ── Webhook verification (Meta sends a GET when you register the webhook URL) ──

@app.route("/webhook", methods=["GET"])
def webhook_verify():
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")
    if mode == "subscribe" and token == WHATSAPP_WEBHOOK_SECRET:
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
        import json, sys
        print("RAW BODY:", json.dumps(body, indent=2), flush=True)
        for message in parse_body(body):
            handle_message(message)
    except Exception as e:
        import traceback
        print("Processing error:", e, flush=True)
        print(traceback.format_exc(), flush=True)


def _valid_signature(payload: bytes, header: str) -> bool:
    if not header:
        return False
    expected = hmac.new(
        WHATSAPP_WEBHOOK_SECRET.encode(),
        msg=payload,
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(header, expected)


# ── Admin endpoints (no dashboard yet — use curl for demo) ───────────────────

@app.route("/admin/patient", methods=["POST"])
def admin_add_patient():
    """Add a patient for a doctor. Body: {name, phone_number, drug_name, doctor_id (optional)}"""
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
    from database.supabase import _db
    result = _db().table("patients").select("id, name, phone_number, drug_name, status, created_at").order("created_at", desc=True).execute()
    return jsonify(result.data or [])


@app.route("/health")
def health():
    return "ok"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
