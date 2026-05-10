import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Patient } from "@/lib/dashboard-data";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalizeStatus(value: unknown): Patient["status"] {
  const s = String(value ?? "").toLowerCase();
  if (["at-risk", "at_risk", "risk", "en riesgo", "en_riesgo"].includes(s))
    return "at-risk";
  if (["dropped", "abandoned", "abandono", "abandonó", "drop"].includes(s))
    return "dropped";
  return "active";
}

function mapRow(row: Record<string, any>, idx: number): Patient {
  const name: string =
    row.name ?? row.full_name ?? row.fullname ?? row.nombre ?? `Paciente ${idx + 1}`;
  const mockAdherences = [92, 74, 61, 88, 95, 48, 22];
  const mockLastUploads = [
    "hace 12 min",
    "hace 1 h",
    "hace 2 h",
    "hace 3 h",
    "hace 4 h",
    "ayer",
    "hace 9 días",
  ];
  const mockAdherence = mockAdherences[idx % mockAdherences.length];
  const mockLastUpload = mockLastUploads[idx % mockLastUploads.length];
  return {
    id: String(row.id ?? row.uuid ?? idx),
    name,
    initials: row.initials ?? getInitials(name),
    age: Number(row.age ?? row.edad ?? 0),
    enrolledDay: Number(row.enrolled_day ?? row.day ?? row.dia ?? 1),
    adherence: Number(row.adherence ?? row.adherencia ?? mockAdherence),
    status: normalizeStatus(row.status ?? row.estado),
    lastUpload: String(row.last_upload ?? row.lastUpload ?? row.ultima_carga ?? mockLastUpload),
    flags: Array.isArray(row.flags)
      ? row.flags
      : typeof row.flags === "string"
        ? row.flags.split(",").map((f: string) => f.trim()).filter(Boolean)
        : [],
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    gender: row.gender ?? null,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    city: row.city ?? null,
    diagnosis: row.diagnosis ?? null,
    treatmentStartDate: row.treatment_start_date ?? null,
  };
}

export function usePatients() {
  const [data, setData] = useState<Patient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows, error } = await supabase.from("patients").select("*");
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const mapped = (rows ?? []).map(mapRow);
      mapped.sort((a, b) => {
        const aC = a.name.toLowerCase().startsWith("candela") ? 0 : 1;
        const bC = b.name.toLowerCase().startsWith("candela") ? 0 : 1;
        return aC - bC;
      });
      setData(mapped);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, loading };
}