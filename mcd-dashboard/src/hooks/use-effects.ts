import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Efecto {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  created_at: string;
  patient_id: string | null;
  patient: { id: string; name: string } | null;
  patient_count: number;
  patient_ids: string[];
}

export function useEfectos() {
  const [data, setData] = useState<Efecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows, error } = await supabase
        .from("efectos" as any)
        .select("*, efecto_paciente(patient_id)")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const mapped = ((rows ?? []) as any[]).map((r) => ({
        ...r,
        patient_ids: Array.isArray(r.efecto_paciente)
          ? r.efecto_paciente.map((ep: any) => ep.patient_id)
          : [],
        patient_count: Array.isArray(r.efecto_paciente) ? r.efecto_paciente.length : 0,
      })) as Efecto[];
      setData(mapped);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}