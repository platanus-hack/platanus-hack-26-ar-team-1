import {
  Camera,
  Mic,
  Video,
  FileText,
  Sparkles,
  Play,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Activity,
} from "lucide-react";
import type { MediaUpload, Severity, AlertLevel } from "@/lib/dashboard-data";

const alertConfig: Record<
  string,
  { label: string; icon: typeof ShieldCheck; className: string }
> = {
  ninguna: {
    label: "Sin alerta",
    icon: ShieldCheck,
    className: "bg-success/15 text-success border-success/30",
  },
  baja: {
    label: "Alerta baja",
    icon: ShieldAlert,
    className: "bg-info/15 text-info border-info/30",
  },
  media: {
    label: "Alerta media",
    icon: AlertTriangle,
    className:
      "bg-warning/20 text-warning-foreground border-warning/40",
  },
  alta: {
    label: "Alerta alta",
    icon: AlertOctagon,
    className: "bg-destructive/15 text-destructive border-destructive/40",
  },
};

function getAlertConfig(level?: AlertLevel) {
  const key = String(level ?? "").toLowerCase();
  return alertConfig[key] ?? alertConfig.ninguna;
}

const signalCategoryStyles: Record<string, string> = {
  esperado_ozempuc: "border-info/30 bg-info/10 text-info",
  potencialmente_relacionado:
    "border-warning/40 bg-warning/15 text-warning-foreground",
  no_relacionado: "border-border bg-secondary text-muted-foreground",
  indeterminado: "border-border bg-secondary text-foreground",
};

const typeIcon = {
  selfie: Camera,
  audio: Mic,
  video: Video,
  text: FileText,
} as const;

const severityStyles: Record<Severity, string> = {
  ok: "bg-success/10 text-success border-success/20",
  low: "bg-info/10 text-info border-info/20",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

export function MediaCard({ upload }: { upload: MediaUpload }) {
  const Icon = typeIcon[upload.type];

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_32px_-16px_oklch(0.55_0.22_275/0.3)]">
      {/* Media preview */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {upload.thumbnail ? (
          <img
            src={upload.thumbnail}
            alt={`${upload.type} de ${upload.patient}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-soft to-secondary">
            <Icon className="h-12 w-12 text-primary/60" strokeWidth={1.5} />
          </div>
        )}
        {(upload.type === "video" || upload.type === "audio") && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/10 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card/90 shadow-lg backdrop-blur">
              <Play className="ml-0.5 h-5 w-5 fill-foreground text-foreground" />
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          <Icon className="h-3.5 w-3.5" />
          <span className="capitalize">{upload.type}</span>
          {upload.duration && (
            <span className="text-muted-foreground">· {upload.duration}</span>
          )}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-medium text-background backdrop-blur">
          D{upload.day}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
              {upload.patientInitials}
            </div>
            <span className="text-sm font-medium text-foreground">
              {upload.patient}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {upload.uploadedAt}
          </span>
        </div>

        {/* AI insight */}
        <div className="mt-3 rounded-xl border border-primary/15 bg-primary-soft/40 p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Insight IA
            </span>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {Math.round(upload.aiConfidence * 100)}%
            </span>
          </div>
          {upload.aiAnalysis ? (
            (() => {
              const cfg = getAlertConfig(upload.aiAnalysis.alertLevel);
              const AlertIcon = cfg.icon;
              return (
                <div className="space-y-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${cfg.className}`}
                  >
                    <AlertIcon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </span>
                  {upload.aiAnalysis.signals.length > 0 && (
                    <ul className="space-y-1.5">
                      {upload.aiAnalysis.signals.slice(0, 4).map((s, i) => {
                        const rawCat = String(s.category ?? "").toLowerCase();
                        const normalizedCat = rawCat.replace(/ozempic/g, "ozempuc");
                        const catClass =
                          signalCategoryStyles[normalizedCat] ??
                          "border-border bg-secondary text-foreground";
                        const catLabel = normalizedCat
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase());
                        return (
                          <li
                            key={i}
                            className="rounded-lg border border-border/70 bg-card/60 p-2"
                          >
                            <div className="mb-1 flex items-center gap-1.5">
                              <Activity className="h-3 w-3 text-primary" />
                              <span className="text-sm font-semibold text-foreground">
                                {s.name}
                              </span>
                              {s.category && (
                                <span
                                  className={`ml-auto rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${catClass}`}
                                >
                                  {catLabel}
                                </span>
                              )}
                            </div>
                            {s.description && (
                              <p
                                className="overflow-hidden text-xs leading-snug text-muted-foreground"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {s.description}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })()
          ) : (
            <p
              className="overflow-hidden whitespace-pre-line text-sm leading-snug text-foreground/90"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 7,
                WebkitBoxOrient: "vertical",
              }}
            >
              {upload.aiInsight}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {upload.aiTags.map((tag) => (
            <span
              key={tag.label}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${severityStyles[tag.severity]}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}