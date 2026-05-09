import base64
import requests
import anthropic
from config.envvars import ANTHROPIC_API_KEY
from agents.knowledge.ozempic_knowledge import IMAGE_KNOWLEDGE

_BASE_CONTEXT = """Sos parte del equipo de seguimiento médico de un laboratorio farmacéutico.
Tu rol es como el de una visita médica: acompañás al paciente durante su tratamiento, pero NO sos médico.
Nunca dés diagnósticos, nunca alarmés al paciente, siempre sé empático y tranquilizador."""

_SYSTEM = _BASE_CONTEXT + """

Tu tarea específica: analizar una imagen enviada por el paciente durante el seguimiento de su
tratamiento con {drug_name}.

{drug_knowledge}

Analizá la imagen aplicando la guía anterior. Sé breve, factual y sin alarmar.
Escribí en español. No incluyas recomendaciones ni diagnósticos directos al paciente:
este análisis va al equipo médico, no al paciente."""

_TOOLS = [
    {
        "name": "report_image_findings",
        "description": "Reporta los hallazgos del análisis visual de la imagen del paciente.",
        "input_schema": {
            "type": "object",
            "properties": {
                "observations": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Lista de observaciones visuales concretas. Ej: 'Mejillas con menor volumen respecto a baseline'. Lista vacía si no hay nada relevante.",
                },
                "relevant_signals": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "signal": {"type": "string", "description": "Nombre de la señal clínica. Ej: 'Ozempic Face', 'Eritema en zona de inyección'"},
                            "description": {"type": "string", "description": "Descripción objetiva de lo observado"},
                            "category": {"type": "string", "enum": ["esperado_ozempic", "potencialmente_relacionado", "no_relacionado", "indeterminado"]},
                        },
                        "required": ["signal", "description", "category"],
                    },
                    "description": "Señales con implicancia clínica para el tratamiento.",
                },
                "alert_level": {
                    "type": "string",
                    "enum": ["ninguna", "baja", "moderada", "alta", "urgente"],
                    "description": "Nivel de alerta global basado en los hallazgos visuales.",
                },
                "request_followup": {
                    "type": "string",
                    "enum": ["none", "better_photo", "photo_injection_site", "photo_hair"],
                    "description": "Si la imagen no es suficiente o se detectó algo que requiere otra foto.",
                },
                "analysis_notes": {
                    "type": "string",
                    "description": "Limitaciones del análisis: mala iluminación, ángulo inadecuado, imagen poco clara, etc. Vacío si no hay.",
                },
            },
            "required": ["observations", "relevant_signals", "alert_level", "request_followup", "analysis_notes"],
        },
    }
]


def analyze_image(media_url: str, patient: dict) -> dict:
    """
    Analyze a patient image with Claude Vision.
    Returns structured dict with: observations, relevant_signals, alert_level,
    request_followup, analysis_notes.
    Falls back to legacy text format if tool call fails.
    """
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    drug_name = patient.get("drug_name", "medicamento indicado")

    # Inject drug-specific knowledge when drug is Ozempic
    if "ozempic" in drug_name.lower() or "semaglutida" in drug_name.lower():
        drug_knowledge = IMAGE_KNOWLEDGE
    else:
        drug_knowledge = f"Analizá señales visuales generales relevantes para el tratamiento con {drug_name}."

    system = _SYSTEM.format(drug_name=drug_name, drug_knowledge=drug_knowledge)
    user_text = (
        f"Paciente: {patient['name']}. Medicamento: {drug_name}. "
        f"Analizá esta imagen aplicando la guía clínica."
    )

    def _call_api(image_content: dict) -> dict:
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=600,
            system=system,
            tools=_TOOLS,
            tool_choice={"type": "any"},
            messages=[{
                "role": "user",
                "content": [image_content, {"type": "text", "text": user_text}],
            }],
        )
        for block in resp.content:
            if block.type == "tool_use" and block.name == "report_image_findings":
                return block.input
        # Fallback if tool not called
        return {
            "observations": [],
            "relevant_signals": [],
            "alert_level": "ninguna",
            "request_followup": "none",
            "analysis_notes": "No se pudo estructurar el análisis.",
        }

    # Try URL source first (public Supabase Storage URLs)
    try:
        return _call_api({"type": "image", "source": {"type": "url", "url": media_url}})
    except Exception:
        pass

    # Fallback: download and encode as base64
    r = requests.get(media_url, timeout=30)
    mime = r.headers.get("Content-Type", "image/jpeg").split(";")[0]
    img_b64 = base64.standard_b64encode(r.content).decode("utf-8")
    return _call_api({
        "type": "image",
        "source": {"type": "base64", "media_type": mime, "data": img_b64},
    })
