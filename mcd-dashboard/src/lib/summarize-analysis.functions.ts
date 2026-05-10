import { createServerFn } from "@tanstack/react-start";

export const summarizeAnalysis = createServerFn({ method: "POST" })
  .inputValidator((data: { analysis: string }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const raw = data.analysis?.slice(0, 8000) ?? "";
    if (!raw.trim()) return { summary: "" };

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "Sos un asistente clínico. Resumí el análisis IA de un paciente en español, en máximo 6 líneas cortas, claro y útil para un médico. Usá viñetas con guiones (-). No uses markdown ni JSON. No superes 6 líneas.",
            },
            { role: "user", content: raw },
          ],
        }),
      },
    );

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`AI gateway error ${resp.status}: ${t}`);
    }
    const json = await resp.json();
    const summary: string = json?.choices?.[0]?.message?.content ?? "";
    return { summary: summary.trim() };
  });