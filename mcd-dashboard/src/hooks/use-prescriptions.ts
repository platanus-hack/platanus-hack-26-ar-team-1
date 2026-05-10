import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PrescriptionsData {
  drugs: string[];
  drugByPatient: Map<string, Set<string>>;
}

function pickDrug(row: Record<string, any>): string | null {
  const v =
    row.drug_name ??
    row.drug ??
    row.medication ??
    row.medication_name ??
    row.medicamento ??
    row.droga ??
    row.name;
  if (!v) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export function usePrescriptions() {
  const [data, setData] = useState<PrescriptionsData>({
    drugs: [],
    drugByPatient: new Map(),
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows, error } = await supabase
        .from("prescriptions")
        .select("*");
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const drugSet = new Set<string>();
      const drugByPatient = new Map<string, Set<string>>();
      (rows ?? []).forEach((r: any) => {
        const drug = pickDrug(r);
        if (!drug) return;
        drugSet.add(drug);
        const pid = r.patient_id ? String(r.patient_id) : null;
        if (pid) {
          const set = drugByPatient.get(pid) ?? new Set<string>();
          set.add(drug);
          drugByPatient.set(pid, set);
        }
      });
      setData({
        drugs: Array.from(drugSet).sort((a, b) => a.localeCompare(b)),
        drugByPatient,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading, error };
}
