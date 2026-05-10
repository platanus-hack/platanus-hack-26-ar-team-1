import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MediaUpload, Severity } from "@/lib/dashboard-data";
import type { RetentionPoint } from "@/hooks/use-daily-summary";

const severityRank: Record<Severity, number> = { ok: 0, low: 1, medium: 2, high: 3 };
void severityRank;

interface Props {
  uploads: MediaUpload[];
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  retentionData: RetentionPoint[];
}

export function RetentionChart({ uploads, selectedDay, onSelectDay, retentionData }: Props) {
  const uploadsByDay = new Map<number, MediaUpload[]>();
  uploads.forEach((u) => {
    const arr = uploadsByDay.get(u.day) ?? [];
    arr.push(u);
    uploadsByDay.set(u.day, arr);
  });
  const chartData = retentionData.map((d) => {
    const dayNum = Number(d.day.replace("D", ""));
    return { ...d, uploads: (uploadsByDay.get(dayNum) ?? []).length };
  });
  void selectedDay;
  void onSelectDay;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Retención del cohort
          </h3>
          <p className="text-sm text-muted-foreground">
            Pacientes activos por día de tratamiento
          </p>
        </div>
      </div>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 16, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="retentionFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="oklch(0.55 0.22 275)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="oklch(0.55 0.22 275)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.92 0.01 260)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="oklch(0.5 0.03 260)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="oklch(0.5 0.03 260)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{
                value: "pacientes",
                angle: -90,
                position: "insideLeft",
                style: {
                  fill: "oklch(0.5 0.03 260)",
                  fontSize: 11,
                  textAnchor: "middle",
                },
              }}
            />
            <Tooltip
              contentStyle={{
                background: "oklch(1 0 0)",
                border: "1px solid oklch(0.92 0.01 260)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 8px 24px -12px oklch(0.18 0.03 264 / 0.25)",
              }}
              labelStyle={{ color: "oklch(0.18 0.03 264)", fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="pacientes"
              stroke="oklch(0.55 0.22 275)"
              strokeWidth={2.5}
              fill="url(#retentionFill)"
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}