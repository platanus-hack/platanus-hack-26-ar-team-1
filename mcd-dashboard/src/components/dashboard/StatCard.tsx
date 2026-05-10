import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive";
}

const accentMap = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
} as const;

export function StatCard({
  label,
  value,
  delta,
  trend = "neutral",
  icon: Icon,
  accent = "primary",
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-3.5 transition-all hover:border-primary/30 hover:shadow-[0_8px_32px_-12px_oklch(0.55_0.22_275/0.25)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {delta && (
            <p className={`mt-0.5 text-[11px] font-medium ${trendColor}`}>{delta}</p>
          )}
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentMap[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}