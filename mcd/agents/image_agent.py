import base64
import requests
import anthropic
from config.envvars import ANTHROPIC_API_KEY

_BASE_CONTEXT = """Sos parte del equipo de seguimiento médico de un laboratorio farmacéutico.
Tu rol es como el de una visita médica: acompañás al paciente durante su tratamiento, pero NO sos médico.
Nunca dés diagnósticos, nunca alarmés al paciente, siempre sé empático y tranquilizador."""

_SYSTEM = _BASE_CONTEXT + """

Tu tarea específica: analizar una imagen enviada por el paciente durante el seguimiento de su tratamiento con {drug_name}.

Observá y reportá de forma objetiva:
- Expresión facial: ¿parece cómodo, con dolor, fatigado, normal?
- Piel visible: rojeces, erupciones, palidez, ojeras u otras alteraciones
- Postura o contexto: cualquier indicador del estado físico general
- Cualquier señal que pueda relacionarse con efectos del medicamento

Sé breve, factual y sin alarmar. Escribí en español. No incluyas recomendaciones ni diagnósticos."""


def analyze_image(media_url: str, patient: dict) -> str:
    """Analyze a patient image with Claude Vision. Returns observation text."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    system = _SYSTEM.format(drug_name=patient["drug_name"])
    user_text = f"Paciente: {patient['name']}. Medicamento: {patient['drug_name']}. Analizá esta imagen."

    # Try URL source first (works for public Supabase Storage URLs)
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=400,
            system=system,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "url", "url": media_url}},
                    {"type": "text", "text": user_text},
                ],
            }],
        )
        return resp.content[0].text
    except Exception:
        pass

    # Fallback: download and encode as base64
    r = requests.get(media_url, timeout=30)
    mime = r.headers.get("Content-Type", "image/jpeg").split(";")[0]
    img_b64 = base64.standard_b64encode(r.content).decode("utf-8")

    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        system=system,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": mime, "data": img_b64}},
                {"type": "text", "text": user_text},
            ],
        }],
    )
    return resp.content[0].text
