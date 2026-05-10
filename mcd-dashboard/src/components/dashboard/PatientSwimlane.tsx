import { Camera, Mic, Video, FileText, Sparkles, X, Play } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TIMELINE_DAYS,
  type MediaUpload,
  type MediaType,
  type Patient,
  type Severity,
} from "@/lib/dashboard-data";

const typeIcon: Record<MediaType, typeof Camera> = {
  selfie: Camera,
  audio: Mic,
  video: Video,
  text: FileText,
};

const severityBg: Record<Severity, string> = {
  ok: "bg-success text-white",
  low: "bg-info text-white",
  medium: "bg-warning text-warning-foreground",
  high: "bg-destructive text-destructive-foreground",
};

const severityLabel: Record<Severity, string> = {
  ok: "Estable",
  low: "Leve",
  medium: "Moderado",
  high: "Alerta",
};

const lanes: { type: MediaType; label: string }[] = [
  { type: "selfie", label: "Efecto Nuevo" },
  { type: "audio", label: "Efecto Controlado" },
  { type: "video", label: "Efecto Justificado" },
];

const milestones = [1, 10, 20, 30, 40, 50, 60];

const severityRank: Record<Severity, number> = { ok: 0, low: 1, medium: 2, high: 3 };

interface SwimlaneEvent {
  day: number;
  type: MediaType;
  severity: Severity;
  note: string;
  thumbnail?: string;
}

export function PatientSwimlane({
  patient,
  onClose,
  uploads,
}: {
  patient: Patient;
  onClose: () => void;
  uploads?: MediaUpload[];
}) {
  const [openEvent, setOpenEvent] = useState<SwimlaneEvent | null>(null);

  const events = useMemo<SwimlaneEvent[]>(() => {
    if (uploads && uploads.length > 0) {
      return uploads.map((u) => {
        const topSeverity = u.aiTags.reduce<Severity>(
          (acc, t) => (severityRank[t.severity] > severityRank[acc] ? t.severity : acc),
          "ok",
        );
        return {
          day: u.day,
          type: u.type,
          severity: topSeverity,
          note: u.aiInsight,
          thumbnail: u.thumbnail,
        };
      });
    }
    return patient.timeline.map((e) => ({ ...e }));
  }, [uploads, patient.timeline]);

  return (
    <div className="border-t border-border bg-gradient-to-b from-secondary/30 to-transparent p-6">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {patient.initials}
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">
              Evolución de {patient.name}
            </h4>
            <p className="text-xs text-muted-foreground">
              {events.length} eventos entre D1 y D{TIMELINE_DAYS} ·{" "}
              {patient.adherence}% adherencia
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Day axis */}
      <div className="ml-28 mb-1 flex h-4 items-end justify-between text-[10px] text-muted-foreground">
        {milestones.map((d) => (
          <span key={d} className="tabular-nums">
            D{d}
          </span>
        ))}
      </div>
      <div className="ml-28 mb-3 h-px bg-border" />

      <div className="space-y-3">
        {lanes.map((lane) => {
          const Icon = typeIcon[lane.type];
          const laneEvents = events.filter((e) => e.type === lane.type);
          return (
            <div key={lane.type} className="flex items-center gap-4">
              <div className="flex w-24 shrink-0 items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-card text-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-foreground">
                  {lane.label}
                </span>
              </div>
              <div className="relative h-10 flex-1 rounded-lg border border-border bg-card">
                {/* gridlines */}
                {milestones.slice(1, -1).map((d) => (
                  <div
                    key={d}
                    className="absolute top-0 h-full w-px bg-border/60"
                    style={{ left: `${(d / TIMELINE_DAYS) * 100}%` }}
                  />
                ))}
                {laneEvents.map((e, i) => (
                  <button
                    key={i}
                    title={`D${e.day} · ${e.note}`}
                    onClick={() => setOpenEvent(e)}
                    className={`group/event absolute top-1/2 flex h-7 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-md px-2 text-[10px] font-semibold shadow-sm transition-transform hover:z-10 hover:scale-110 ${severityBg[e.severity]}`}
                    style={{ left: `${(e.day / TIMELINE_DAYS) * 100}%` }}
                  >
                    <span className="tabular-nums">D{e.day}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend + insights */}
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Severidad IA
        </span>
        {(Object.keys(severityBg) as Severity[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm ${severityBg[s].split(" ")[0]}`} />
            <span className="text-xs text-muted-foreground">
              {severityLabel[s]}
            </span>
          </div>
        ))}
      </div>

      {/* Recent insights summary */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {events.slice(-4).reverse().map((e, i) => {
          const Icon = typeIcon[e.type];
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${severityBg[e.severity]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    D{e.day} · {e.type}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary">
                    <Sparkles className="h-3 w-3" />
                    IA
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {e.note}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!openEvent} onOpenChange={(o) => !o && setOpenEvent(null)}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          {openEvent && (() => {
            const Icon = typeIcon[openEvent.type];
            const preview =
              openEvent.thumbnail &&
              (openEvent.type === "selfie" || openEvent.type === "video")
                ? openEvent.thumbnail
                : null;
            return (
              <div>
                <div className="relative aspect-video bg-secondary">
                  {preview ? (
                    <img
                      src={preview}
                      alt={`${openEvent.type} de ${patient.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-soft to-secondary">
                      <Icon className="h-16 w-16 text-primary/60" strokeWidth={1.3} />
                    </div>
                  )}
                  {openEvent.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card/90 shadow-lg backdrop-blur">
                        <Play className="ml-0.5 h-6 w-6 fill-foreground text-foreground" />
                      </div>
                    </div>
                  )}
                  {openEvent.type === "audio" && (
                    <div className="absolute inset-x-6 bottom-6 flex items-end gap-1">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <span
                          key={i}
                          className="flex-1 rounded-sm bg-primary/70"
                          style={{ height: `${20 + Math.abs(Math.sin(i)) * 60}%` }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="capitalize">{openEvent.type}</span>
                  </div>
                  <div className="absolute right-3 top-3 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-medium text-background backdrop-blur">
                    D{openEvent.day}
                  </div>
                </div>
                <div className="p-5">
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                      {patient.initials}
                    </div>
                    <span>{patient.name}</span>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${severityBg[openEvent.severity]}`}>
                      {severityLabel[openEvent.severity]}
                    </span>
                  </DialogTitle>
                  <div className="mt-4 rounded-xl border border-primary/15 bg-primary-soft/40 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Insight IA
                      </span>
                    </div>
                    <p className="text-sm leading-snug text-foreground/90">
                      {openEvent.note}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}