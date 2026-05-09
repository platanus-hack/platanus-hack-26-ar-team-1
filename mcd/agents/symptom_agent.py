import anthropic
from config.envvars import ANTHROPIC_API_KEY

_BASE_CONTEXT = """Sos parte del equipo de seguimiento médico de un laboratorio farmacéutico.
Tu rol es como el de una visita médica: recolectás información sobre cómo le está yendo al paciente con su tratamiento, pero NO sos médico.
Nunca dés diagnósticos, nunca alarmés, siempre sé empático y tranquilizador.
Trabajás por WhatsApp: sé conciso, cálido, conversacional. Una sola pregunta por mensaje."""

_SYSTEM = _BASE_CONTEXT + """

Paciente: {patient_name}
Medicamento: {drug_name}

Tu tarea:
1. Analizar la respuesta más reciente del paciente y extraer síntomas, señales de adherencia o preocupaciones mencionadas
2. Revisar el historial para saber qué áreas ya fueron cubiertas
3. Formular el siguiente mensaje: ya sea la próxima pregunta más relevante, o el cierre si ya cubriste todo

Áreas clave a cubrir (no en orden estricto, adaptá según el flujo natural):
- Adherencia: ¿tomó el medicamento como indicó el médico?
- Efectos secundarios: ¿tuvo molestias, reacciones o cambios físicos?
- Dosis olvidadas: ¿hubo días sin tomar?
- Cambios en salud general desde que empezó el tratamiento
- Dudas o preguntas sobre el medicamento

Historial de la conversación:
{conversation_summary}"""

_TOOLS = [
    {
        "name": "process_and_next",
        "description": "Procesa la respuesta del paciente y determina el siguiente paso de la entrevista.",
        "input_schema": {
            "type": "object",
            "properties": {
                "symptoms_noted": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Síntomas u observaciones clínicas extraídas de la respuesta del paciente. Lista vacía si no hay.",
                },
                "adherence_signal": {
                    "type": "string",
                    "enum": ["high", "medium", "low", "unclear"],
                    "description": "Señal de adherencia al tratamiento inferida de esta respuesta.",
                },
                "is_complete": {
                    "type": "boolean",
                    "description": "True si ya se cubrieron todas las áreas necesarias y la entrevista debe cerrarse.",
                },
                "next_message": {
                    "type": "string",
                    "description": "El próximo mensaje a enviar al paciente: la siguiente pregunta o, si is_complete=true, un mensaje de cierre cálido.",
                },
            },
            "required": ["symptoms_noted", "adherence_signal", "is_complete", "next_message"],
        },
    }
]


def analyze_and_next(patient: dict, conversation_history: list, latest_message: str, image_analysis: str = None, questions_so_far: int = 0) -> dict:
    """
    Analyze the patient's latest response and generate the next question.
    Returns dict with: symptoms_noted, adherence_signal, is_complete, next_message
    """
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    history_lines = []
    for msg in conversation_history[-12:]:
        role = "Paciente" if msg["direction"] == "inbound" else "Bot"
        content = msg.get("content") or ""
        if msg.get("media_url"):
            content += " [imagen adjunta]"
        if content.strip():
            history_lines.append(f"{role}: {content}")
    conversation_summary = "\n".join(history_lines) if history_lines else "(primera interacción)"

    system = _SYSTEM.format(
        patient_name=patient["name"],
        drug_name=patient["drug_name"],
        conversation_summary=conversation_summary,
    )

    user_content = f"Preguntas ya respondidas hasta ahora: {questions_so_far}\n"
    user_content += f"Respuesta del paciente: {latest_message}" if latest_message else "(el paciente no envió texto)"
    if image_analysis:
        user_content += f"\n\nAnálisis de la imagen que envió: {image_analysis}"

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        system=system,
        tools=_TOOLS,
        tool_choice={"type": "any"},
        messages=[{"role": "user", "content": user_content}],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "process_and_next":
            return block.input

    # Fallback (should not happen with tool_choice=required)
    return {
        "symptoms_noted": [],
        "adherence_signal": "unclear",
        "is_complete": False,
        "next_message": "¿Cómo te sentís en general con el tratamiento?",
    }
