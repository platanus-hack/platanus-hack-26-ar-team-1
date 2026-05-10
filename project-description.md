# MCD — Medical CRO Disruptor

> Reemplazamos a las CRO tradicionales con un pipeline directo médico → paciente → laboratorio, impulsado por IA.

## El problema

Los laboratorios farmacéuticos pagan entre $200K y $2M a CROs (Contract Research Organizations) para recolectar datos de adherencia de pacientes durante tratamientos. El proceso tarda meses, depende de fieldwork manual y entrega información desactualizada.

## La solución

MCD crea un canal de datos directo desde el paciente hasta el laboratorio, usando WhatsApp — el canal que los pacientes ya usan — y agentes de IA que realizan el seguimiento de forma autónoma.

**El flujo completo:**

1. El médico carga al paciente (nombre, teléfono, medicamento) en el dashboard
2. El paciente escribe al bot de WhatsApp → comienza el cuestionario
3. Un agente de síntomas conduce una entrevista dinámica por LLM, adaptando las preguntas según las respuestas
4. Un agente de visión analiza imágenes enviadas por el paciente (rostro, zona de inyección) detectando señales clínicas como "Ozempic Face" o reacciones cutáneas
5. Cada respuesta queda guardada con análisis estructurado: síntomas, nivel de alerta, adherencia
6. Si el paciente no responde en 48h → marcado como no responsivo (alerta roja)
7. El laboratorio genera un reporte de cohorte con un clic: adherencia, efectos secundarios, alertas, resumen por paciente

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Bot WhatsApp | Python (Flask + Waitress) en Railway |
| Conectividad WhatsApp | Kapso proxy + Meta Graph API |
| Agente de síntomas | Claude API (`claude-sonnet-4-6`) — entrevista dinámica por LLM |
| Agente de visión | Claude Vision — análisis de imágenes clínicas |
| Base de datos | Supabase (PostgreSQL + Storage) |
| Dashboard médico | Next.js en Railway |
| Dashboard laboratorio | React (Lovable) |

## Lo que diferencia a MCD

- **Sin formularios**: conversación natural por WhatsApp, canal que el paciente ya usa
- **Multi-modal**: procesa texto, audio e imágenes en la misma conversación
- **Tiempo real**: datos disponibles inmediatamente, no en 3 meses
- **Escalable**: un bot atiende miles de pacientes simultáneamente
- **Costo**: fracción del costo de una CRO tradicional
