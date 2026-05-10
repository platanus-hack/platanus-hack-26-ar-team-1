import time
from integrations.whatsapp import send_message, send_typing

# In-memory state: phone → step (0-5)
_state: dict[str, int] = {}


def demo_flow(record, patient):
    phone = record["profile"]["phone_number"]
    msg_id = record.get("msg_id")
    text = (record.get("text") or "").strip()
    name = patient.get("name") or "Candela"

    send_typing(phone, msg_id)

    # RESTART resets to step 0 and sends welcome immediately
    if text.upper() == "RESTART":
        _state[phone] = 0
        _send_welcome(phone, name)
        _state[phone] = 1
        return

    step = _state.get(phone, 0)

    if step == 0:
        _send_welcome(phone, name)
        _state[phone] = 1

    elif step == 1:
        send_message("Buenísimo, ¿cómo te sentís? Por favor mandame una foto de tu rostro.", phone)
        _state[phone] = 2

    elif step == 2:
        send_message("Qué bueno saberlo. Recordá que podés escribirme cuando lo necesités.", phone)
        time.sleep(5)
        send_message("3 dias después...", phone)
        send_message(
            f"Hola {name}, soy MCD. ¿Cómo vas con el tratamiento hasta ahora?\n\n"
            "Para tu seguimiento de hoy, enviame una foto de tu rostro con buena luz.",
            phone,
        )
        _state[phone] = 3

    elif step == 3:
        send_message(
            "Antes de continuar necesito hacerte unas preguntas.\n\n"
            "¿Dormiste mal esta noche?\n\n"
            "¿Estás bajo estrés o ansioso/a?\n\n"
            "¿Tomaste café, mate u otras bebidas más de lo habitual?",
            phone,
        )
        _state[phone] = 4

    elif step == 4:
        send_message("Gracias por compartir tu respuesta!", phone)
        time.sleep(5)
        send_message("14 dias despues...", phone)
        _state[phone] = 5

    elif step == 5:
        send_message(
            f"¡Hola {name}! Lamento que te sientas así.\n\n"
            "Ese no es un efecto esperado de Ozempuc, deberías chequearlo a la brevedad con el Dr. Platanus.",
            phone,
        )
        # Loop back
        _state[phone] = 0


def _send_welcome(phone: str, name: str):
    send_message(
        f"¡Hola {name}! Qué bueno tenerte por acá. Soy MCD parte del equipo de seguimiento del laboratorio.\n\n"
        f"Estoy acá para acompañarte durante tu tratamiento con Ozempuc.\n\n"
        "Antes de continuar necesito saber si ya iniciaste tu tratamiento.",
        phone,
    )
