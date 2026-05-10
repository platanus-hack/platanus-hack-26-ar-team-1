import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisInsight } from "@/lib/dashboard-data";

function parseAnalysis(raw: unknown): AnalysisInsight | null {
  let parsed: any = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;

  const alertLevel =
    parsed.overall_alert_level ?? parsed.image_analysis?.alert_level;
  const signals: any[] = Array.isArray(parsed.relevant_signals)
    ? parsed.relevant_signals
    : Array.isArray(parsed.image_analysis?.relevant_signals)
      ? parsed.image_analysis.relevant_signals
      : [];

  return {
    alertLevel: alertLevel ? String(alertLevel) : undefined,
    signals: signals.slice(0, 5).map((s) => ({
      name: String(s?.signal ?? s?.name ?? "Señal"),
      description: String(s?.description ?? ""),
      category: s?.category ? String(s.category) : undefined,
    })),
  };
}

export function useConversationAnalysis() {
  const [byPatient, setByPatient] = useState<Map<string, AnalysisInsight>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("patient_id, analysis, created_at")
        .not("analysis", "is", null)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const map = new Map<string, AnalysisInsight>();
      (data ?? []).forEach((row: any) => {
        const pid = row.patient_id ? String(row.patient_id) : "";
        if (!pid || map.has(pid)) return;
        const parsed = parseAnalysis(row.analysis);
        if (parsed) map.set(pid, parsed);
      });
      setByPatient(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { byPatient, error, loading };
}