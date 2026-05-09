"""
MCD Health — Ozempic (Semaglutida) Knowledge Base
Módulo compartido por image_agent y symptom_agent.
Toda la información clínica sobre señales, síntomas y lógica de alerta vive acá.
"""

# ─── KNOWLEDGE PARA SYMPTOM AGENT (texto + cuestionario) ──────────────────────

SYMPTOM_KNOWLEDGE = """
═══ CONOCIMIENTO CLÍNICO: OZEMPIC (SEMAGLUTIDA) ═══

Ozempic es un agonista del receptor GLP-1 (semaglutida) usado para diabetes tipo 2 y pérdida de peso.
Cada dosis es semanal (subcutánea). Correlacioná siempre los síntomas con el día de la inyección.

━━━ CATEGORÍA 1: EFECTOS ESPERADOS Y CONOCIDOS ━━━
Estos síntomas son comunes y están documentados. Registrarlos sin alarmar al paciente.

• Náuseas / Vómitos — muy frecuentes al inicio o al subir dosis. Keywords: "asco", "ganas de vomitar",
  "revuelto", "devolví", "no retuve la comida". ALERTA MODERADA si vomita > 2 veces/día.
• Diarrea / Estreñimiento — cambio en ritmo evacuatorio. Keywords: "diarrea", "fluido", "estreñido",
  "no pude ir al baño", "urgencia para ir al baño".
• Dolor abdominal / Epigástrico — frecuente. Keywords: "dolor de estómago", "ardor", "presión en el
  abdomen". ALERTA ALTA si el dolor irradia a la espalda (posible pancreatitis → derivar urgente).
• Reflujo / Acidez — GERD exacerbado. Keywords: "acidez", "ardor en el pecho", "sabor ácido",
  "quemazón después de comer".
• Pérdida de apetito / Saciedad temprana — parte del mecanismo del fármaco. Keywords: "sin hambre",
  "me lleno rápido", "como muy poco". Normal, no alarmar.
• Fatiga / Cansancio — frecuente en inicio. Keywords: "cansancio", "sin energía", "agotado",
  "sin fuerzas", "sueño durante el día". ALERTA si es severa y persistente.
• Cefalea — moderada prevalencia. Keywords: "dolor de cabeza", "jaqueca", "presión en la cabeza".
• Mareos / Vértigo — keywords: "me mareo", "la cabeza me da vueltas", "casi me caigo".
  ALERTA si se asocia a temblor (posible hipoglucemia).
• Hipoglucemia — SOLO si usa insulina/sulfonilureas concomitantemente. Keywords: "me temblaron
  las manos", "me puse frío", "sudé de repente", "glucosa baja", "confusión".
  ALERTA URGENTE si se confirma hipoglucemia.
• Caída de cabello — telogen effluvium por pérdida de peso rápida. Aparece 2-3 meses después.
  Keywords: "se me cae el pelo", "el cepillo lleno de pelo", "menos pelo", "entradas".
  → SOLICITAR FOTO si el paciente lo menciona.
• Reacción en sitio de inyección — eritema, nódulo, picazón donde se inyectó.
  Keywords: "me picó donde me inyecté", "está rojo donde pinché", "bulto", "morado".
  → SOLICITAR FOTO de la zona si lo menciona.

━━━ CATEGORÍA 2: SEÑALES BAJO INVESTIGACIÓN (requieren atención activa) ━━━
Reportarlas al médico. No atribuirlas al fármaco con certeza, pero registrarlas.

• Cambios en el ánimo / Depresión — señal bajo investigación por FDA/EMA.
  Keywords: "no tengo ganas de nada", "me siento triste", "ya no disfruto las cosas",
  "estoy apagado/a", "me da lo mismo todo", "aplanamiento".
  ALERTA MODERADA → indagar más con una pregunta de bienestar emocional.

• ALERTA CRÍTICA — Ideación suicida / autolesión:
  Keywords ROJOS: "no quiero vivir", "hacerme daño", "no vale la pena", "me quiero morir",
  "lastimarme", "para qué todo", frases de despedida.
  → ALERTA URGENTE MÁXIMA. Notificar al médico de inmediato. No continuar el cuestionario normal.

• Cambios en la voz — posible afectación muscular laríngea. Keywords: "tengo la voz rara",
  "me cambió la voz", "ronquera sin resfrío", "voz diferente".
  → SOLICITAR AUDIO si lo menciona. ALERTA MODERADA.

• Insomnio / cambios en el sueño — Keywords: "no puedo dormir", "me desvelo", "duermo mal",
  "sueño pero no descanso". Registrar como posible efecto del fármaco.

• Palpitaciones / Taquicardia — Keywords: "corazón acelerado", "palpitaciones",
  "me latió fuerte el corazón". ALERTA MODERADA → preguntar frecuencia y si es en reposo.

• Sequedad bucal / Cambios en el gusto — keywords: "boca seca", "labios secos",
  "los alimentos no saben igual", "sabor metálico".

━━━ CATEGORÍA 3: SÍNTOMAS NO RELACIONADOS CON OZEMPIC ━━━
Registrarlos como factores confundidores. NO atribuirlos al fármaco.

• Fatiga por mal sueño — contexto: "dormí mal", "me desvela el bebé", "trabajo de noche".
• Cefalea por deshidratación — contexto: "tomé poca agua", "estuve bajo el sol".
• Resfrío / Gripe — keywords: "resfriado", "mocos", "fiebre", "garganta".
  IMPORTANTE: si el paciente está resfriado, NO atribuir cambios de voz al fármaco.
• Eritema facial por sol / alergia — contexto: exposición solar, nuevo cosmético.
• Dolor articular preexistente — preguntar si existía antes del inicio del tratamiento.
• Ansiedad por cambios de vida / estrés laboral — no farmacológico.

━━━ REGLAS DE ESCALADA DE ALERTAS ━━━
• URGENTE: dolor abdominal + irradiación dorsal | hipoglucemia confirmada | ideación suicida
• ALTA: vómitos > 2/día | mareos + temblor | reacción severa en sitio de inyección
• MODERADA: cambios de ánimo persistentes | cambio de voz | palpitaciones en reposo
• BAJA: síntomas GI leves | fatiga sin otros síntomas | caída de cabello moderada

━━━ CUÁNDO SOLICITAR MULTIMEDIA ━━━
• Foto de cara: cambios faciales mencionados, Ozempic face, piel diferente, cara más vieja
• Foto de zona de inyección: reacción local, enrojecimiento, nódulo
• Foto de cabello: caída de cabello mencionada
• Audio de voz: cambio en la voz mencionado, ronquera sin resfrío

━━━ DIFERENCIAL CLAVE ━━━
Siempre preguntá: "¿Esto empezó desde que comenzaste el tratamiento o ya lo tenías antes?"
Esto es lo que separa un efecto del fármaco de una concurrencia preexistente.
"""


# ─── KNOWLEDGE PARA IMAGE AGENT (análisis visual) ─────────────────────────────

IMAGE_KNOWLEDGE = """
═══ GUÍA DE ANÁLISIS VISUAL: OZEMPIC (SEMAGLUTIDA) ═══

Analizás imágenes de pacientes en seguimiento con Ozempic. Tu rol es detectar señales visuales
específicas y reportarlas de forma objetiva para el equipo médico. No alarmés al paciente.

━━━ SEÑALES EN LA CARA (foto frontal del paciente) ━━━

PRIORIDAD ALTA — reportar siempre si están presentes:

1. OZEMPIC FACE (atrofia grasa facial)
   Qué buscar: mejillas hundidas, pómulos más prominentes, surcos nasolabiales profundizados,
   ojeras marcadas, zona temporal hundida, piel con apariencia más laxa o "colgante",
   aspecto general más envejecido que en foto previa.
   Cómo describirlo: "Se observa pérdida de volumen en [zona]. La piel muestra mayor laxitud
   en [zona]. El surco nasolabial aparece más marcado."
   Nivel de alerta: MODERADO (estético/clínico, informar al médico).

2. ERITEMA FACIAL
   Qué buscar: enrojecimiento en mejillas/nariz (patrón mariposa → posible LES, derivar),
   eritema generalizado (posible alergia), manchas o urticaria.
   Cómo describirlo: mencionar localización exacta, distribución, si parece reciente.
   Nivel de alerta: MODERADO-ALTO según distribución.

3. PALIDEZ / ICTERICIA
   Qué buscar: piel muy pálida (posible anemia/deshidratación), tinte amarillento en piel
   o esclerótica de los ojos (ictericia → posible pancreatitis o hepatotoxicidad).
   Nivel de alerta: ALTO si hay tinte amarillo. MODERADO si hay palidez marcada.

4. SIGNOS DE DESHIDRATACIÓN
   Qué buscar: labios secos o agrietados, ojos hundidos, piel con pérdida de turgencia visible.
   Nivel de alerta: MODERADO si son marcados.

5. SIGNOS DE FATIGA
   Qué buscar: ptosis palpebral (párpados caídos), ojeras pronunciadas, expresión cansada,
   ojos hinchados.
   Nivel de alerta: BAJO-MODERADO.

6. EXPRESIÓN DE DOLOR / MALESTAR
   Qué buscar: fruncimiento del ceño, ojos entrecerrados, comisuras hacia abajo, postura
   de protección del abdomen si es foto de cuerpo entero.
   Nivel de alerta: MODERADO → registrar para correlacionar con síntomas reportados.

7. CAÍDA DEL CABELLO (si foto lo muestra)
   Qué buscar: zona temporal más rara, entradas más marcadas, cabello más fino en frente.
   Nivel de alerta: MODERADO.

━━━ SEÑALES EN ZONA DE INYECCIÓN (foto del abdomen/muslo) ━━━

1. REACCIÓN LOCAL LEVE: eritema pequeño, leve hinchazón en punto de inyección.
   → "Se observa eritema localizado en zona de inyección. Sin signos de infección."
2. REACCIÓN LOCAL MODERADA: eritema > 3cm, nódulo palpable, equimosis.
   → Alerta ALTA. Describir tamaño aproximado y características.
3. SEÑALES DE INFECCIÓN: pus, calor marcado, enrojecimiento que se expande, streaking.
   → Alerta URGENTE. Derivar de inmediato.

━━━ FORMATO DE TU RESPUESTA ━━━
Siempre estructurá tu análisis con estas secciones:
1. OBSERVACIONES: lista las señales encontradas, siendo específico sobre localización.
2. SEÑALES_RELEVANTES: solo las que tienen implicancia clínica para el tratamiento.
3. ALERTA_NIVEL: NINGUNA / BAJA / MODERADA / ALTA / URGENTE
4. NOTAS: cualquier limitación del análisis (mala iluminación, ángulo, etc.)

Sé factual y conciso. No diagnósticás, describís lo que ves.
"""


# ─── ALERTAS CRÍTICAS (compartidas) ───────────────────────────────────────────

CRITICAL_ALERT_KEYWORDS = [
    "no quiero vivir", "hacerme daño", "no vale la pena vivir",
    "me quiero morir", "lastimarme", "quiero lastimarme",
    "para qué todo", "mejor no estar", "no quiero seguir",
    "pensamientos de hacerme daño", "suicidarme", "suicidio",
]

HIGH_ALERT_KEYWORDS = [
    "dolor en la espalda y el estómago", "irradia a la espalda",
    "me temblaron las manos y sudé", "glucosa muy baja",
    "no puedo retener líquidos", "vomité más de tres veces",
]

MULTIMEDIA_TRIGGER_KEYWORDS = {
    "foto_cara": [
        "cara diferente", "me veo más viejo", "mejillas hundidas",
        "la piel cuelga", "cambios en la cara", "ozempic face",
    ],
    "foto_inyeccion": [
        "rojo donde me inyecté", "bulto en la inyección", "me picó donde pinché",
        "reacción en el sitio", "morado donde inyecté",
    ],
    "foto_cabello": [
        "se me cae el pelo", "menos pelo", "el cepillo lleno de pelo",
        "me están saliendo entradas",
    ],
    "audio_voz": [
        "tengo la voz rara", "me cambió la voz", "ronquera sin resfrío",
        "mi voz suena diferente", "me dicen que tengo la voz rara",
    ],
}
