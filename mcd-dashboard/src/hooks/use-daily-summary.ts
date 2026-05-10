import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MediaType, MediaUpload, Severity } from "@/lib/dashboard-data";

export interface RetentionPoint {
  day: string;
  pacientes: number;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalizeType(value: unknown): MediaType {
  const s = String(value ?? "").toLowerCase();
  if (s.includes("audio")) return "audio";
  if (s.includes("video")) return "video";
  if (s.includes("text") || s.includes("nota") || s.includes("cuestionario"))
    return "text";
  return "selfie";
}

function typeFromUrl(url: string): MediaType {
  const u = url.toLowerCase().split("?")[0];
  if (/\.(mp4|mov|webm|m4v|avi)$/.test(u)) return "video";
  if (/\.(mp3|wav|m4a|ogg|aac|flac)$/.test(u)) return "audio";
  if (/\.(txt|json|md|pdf)$/.test(u)) return "text";
  return "selfie";
}

function normalizeSeverity(value: unknown): Severity {
  const s = String(value ?? "").toLowerCase();
  if (["high", "alto", "alta", "severe"].includes(s)) return "high";
  if (["medium", "med", "medio", "moderate"].includes(s)) return "medium";
  if (["low", "bajo", "leve", "mild"].includes(s)) return "low";
  return "ok";
}

function parseTags(value: unknown): { label: string; severity: Severity }[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((t: any) =>
      typeof t === "string"
        ? { label: t, severity: "ok" as Severity }
        : { label: String(t.label ?? t.tag ?? t.name ?? ""), severity: normalizeSeverity(t.severity) },
    );
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label) => ({ label, severity: "ok" as Severity }));
  }
  return [];
}

function collectUrls(row: Record<string, any>): string[] {
  const raw = row.media_urls ?? row.media_url ?? row.url ?? row.urls;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        // fall through
      }
    }
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function mapRowToUploads(row: Record<string, any>, idx: number): MediaUpload[] {
  const day = Number(row.day ?? row.day_number ?? row.dia ?? row.dia_numero);
  if (!Number.isFinite(day)) return [];

  const urls = collectUrls(row);
  const patient: string =
    row.patient_name ?? row.name ?? row.nombre ?? row.patient ?? `Paciente ${row.patient_id ?? idx}`;
  const tags = parseTags(row.ai_tags ?? row.tags);
  const declaredType = row.media_type ?? row.type;
  const insight = String(row.ai_insight ?? row.insight ?? row.note ?? "");
  const baseId = String(row.id ?? `${row.patient_id ?? idx}-${day}`);

  if (urls.length === 0) {
    if (!declaredType && !insight) return [];
    return [
      {
        id: baseId,
        patientId: row.patient_id ? String(row.patient_id) : undefined,
        patient,
        patientInitials: row.initials ?? getInitials(patient),
        day,
        type: normalizeType(declaredType),
        thumbnail: row.thumbnail ?? undefined,
        duration: row.duration ?? undefined,
        uploadedAt: String(row.uploaded_at ?? row.created_at ?? row.fecha ?? "—"),
        aiInsight: insight,
        aiTags: tags,
        aiConfidence: Number(row.ai_confidence ?? row.confidence ?? 0.8),
      },
    ];
  }

  return urls.map((url, i) => {
    const type: MediaType = declaredType
      ? normalizeType(declaredType)
      : typeFromUrl(url);
    return {
      id: `${baseId}-${i}`,
      patientId: row.patient_id ? String(row.patient_id) : undefined,
      patient,
      patientInitials: row.initials ?? getInitials(patient),
      day,
      type,
      thumbnail: type === "selfie" || type === "video" ? url : (row.thumbnail ?? undefined),
      duration: row.duration ?? undefined,
      uploadedAt: String(row.uploaded_at ?? row.created_at ?? row.fecha ?? "—"),
      aiInsight: insight,
      aiTags: tags,
      aiConfidence: Number(row.ai_confidence ?? row.confidence ?? 0.8),
    };
  });
}

export function useDailySummary() {
  const [uploads, setUploads] = useState<MediaUpload[]>([]);
  const [retention, setRetention] = useState<RetentionPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows, error } = await supabase
        .from("patient_daily_summary")
        .select("*");
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const safeRows = rows ?? [];

      // Build uploads (one per URL in media_urls)
      const mapped = safeRows.flatMap((r, i) => mapRowToUploads(r, i));

      // Build retention: distinct patient_id per day
      const byDay = new Map<number, Set<string>>();
      safeRows.forEach((r: any) => {
        const day = Number(r.day ?? r.day_number ?? r.dia ?? r.dia_numero);
        const pid = String(r.patient_id ?? r.patient ?? r.name ?? "");
        if (!Number.isFinite(day) || !pid) return;
        const set = byDay.get(day) ?? new Set();
        set.add(pid);
        byDay.set(day, set);
      });
      const retentionPoints: RetentionPoint[] = Array.from(byDay.entries())
        .sort(([a], [b]) => a - b)
        .map(([day, set]) => ({ day: `D${day}`, pacientes: set.size }));

      setUploads(mapped);
      setRetention(retentionPoints);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { uploads, retention, loading, error };
}