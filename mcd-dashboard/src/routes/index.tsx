import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Activity,
  Users,
  AlertTriangle,
  Bell,
  Stethoscope,
  LayoutDashboard,
  UsersRound,
  User,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RetentionChart } from "@/components/dashboard/RetentionChart";
import { MediaCard } from "@/components/dashboard/MediaCard";
import { PatientsTable } from "@/components/dashboard/PatientsTable";
import { cohortStats, doctors } from "@/lib/dashboard-data";
import { useDailySummary } from "@/hooks/use-daily-summary";
import { usePrescriptions } from "@/hooks/use-prescriptions";
import { useConversationAnalysis } from "@/hooks/use-conversation-analysis";
import { useEfectos, type Efecto } from "@/hooks/use-effects";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Cohort Dashboard · Adherencia y multimedia" },
      {
        name: "description",
        content:
          "Dashboard clínico para seguir adherencia, retención y multimedia con análisis IA del cohort.",
      },
    ],
  }),
});

function Index() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<string>("__all__");
  const [activeTab, setActiveTab] = useState<string>("general");
  const [selectedEfectoId, setSelectedEfectoId] = useState<string | null>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const { uploads: allUploads, retention: allRetention } = useDailySummary();
  const { drugs, drugByPatient } = usePrescriptions();
  const { byPatient: analysisByPatient } = useConversationAnalysis();
  const { data: efectos } = useEfectos();
  const efectosNuevos = efectos.filter((e) => e.tipo === "nuevo");
  const efectosEsperados = efectos.filter((e) => e.tipo === "esperado");
  const efectosJustificados = efectos.filter((e) => e.tipo === "justificado");
  const selectedEfecto = efectos.find((e) => e.id === selectedEfectoId) ?? null;

  const allowedPatientIds = useMemo(() => {
    if (selectedDrug === "__all__") return null;
    const ids = new Set<string>();
    drugByPatient.forEach((set, pid) => {
      if (set.has(selectedDrug)) ids.add(pid);
    });
    return ids;
  }, [selectedDrug, drugByPatient]);

  const mediaUploads = useMemo(() => {
    let filtered = allUploads;
    if (allowedPatientIds) {
      filtered = filtered.filter(
        (u) => u.patientId && allowedPatientIds.has(u.patientId),
      );
    }
    return filtered.map((u) => {
      const analysis = u.patientId ? analysisByPatient.get(u.patientId) : undefined;
      return analysis ? { ...u, aiAnalysis: analysis } : u;
    });
  }, [allUploads, allowedPatientIds, analysisByPatient]);

  const cohortUploads = useMemo(() => {
    if (!selectedEfecto) return mediaUploads;
    const set = new Set(selectedEfecto.patient_ids);
    return mediaUploads.filter((u) => u.patientId && set.has(u.patientId));
  }, [mediaUploads, selectedEfecto]);

  const handleEfectoClick = (efectoId: string) => {
    setSelectedEfectoId(efectoId);
    setActiveTab("cohort");
  };

  const retention = useMemo(() => {
    if (!allowedPatientIds) return allRetention;
    // Recompute retention from filtered uploads
    const byDay = new Map<number, Set<string>>();
    mediaUploads.forEach((u) => {
      const set = byDay.get(u.day) ?? new Set();
      if (u.patientId) set.add(u.patientId);
      byDay.set(u.day, set);
    });
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a - b)
      .map(([day, set]) => ({ day: `D${day}`, pacientes: set.size }));
  }, [allowedPatientIds, allRetention, mediaUploads]);

  const cohortPatientCount = useMemo(() => {
    if (allowedPatientIds) return allowedPatientIds.size;
    const set = new Set<string>();
    allUploads.forEach((u) => u.patientId && set.add(u.patientId));
    return set.size;
  }, [allowedPatientIds, allUploads]);

  const activePatientCount = useMemo(() => {
    const set = new Set<string>();
    mediaUploads.forEach((u) => u.patientId && set.add(u.patientId));
    return set.size;
  }, [mediaUploads]);

  const handleSelectDay = (day: number | null) => {
    setSelectedDay(day);
    if (day !== null) {
      setTimeout(() => {
        mediaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight text-foreground">
                MCD Health
              </h1>
              <p className="text-sm text-muted-foreground">
                Farmacovigilancia con IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-secondary">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-base font-semibold text-primary">
              DR
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="h-12 p-1.5">
            <TabsTrigger value="general" className="gap-2 px-6 py-2.5 text-base">
              <LayoutDashboard className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="cohort" className="gap-2 px-6 py-2.5 text-base">
              <UsersRound className="h-4 w-4" />
              Cohort
            </TabsTrigger>
            <TabsTrigger value="paciente" className="gap-2 px-6 py-2.5 text-base">
              <User className="h-4 w-4" />
              Paciente
            </TabsTrigger>
          </TabsList>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Droga
              </span>
              <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                <SelectTrigger className="h-9 w-56">
                  <SelectValue placeholder="Todas las drogas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas las drogas</SelectItem>
                  {drugs.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="general" className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-4">
                <StatCard
                  label="Pacientes activos"
                  value={activePatientCount}
                  delta={`de ${cohortPatientCount || cohortStats.totalPacientes} totales`}
                  icon={Users}
                  accent="primary"
                />
                <StatCard
                  label="Adherencia promedio"
                  value={`${cohortStats.adherenciaPromedio}%`}
                  delta="+4% vs semana anterior"
                  trend="up"
                  icon={Activity}
                  accent="success"
                />
                <StatCard
                  label="Efectos Nuevos"
                  value={cohortStats.enRiesgo}
                  delta="2 nuevos esta semana"
                  trend="down"
                  icon={AlertTriangle}
                  accent="warning"
                />
              </div>
              <div className="lg:col-span-2">
                <RetentionChart
                  uploads={mediaUploads}
                  selectedDay={selectedDay}
                  onSelectDay={handleSelectDay}
                  retentionData={retention}
                />
              </div>
            </section>
            <EfectoGroup
              titulo="Efectos Nuevos"
              tipo="nuevo"
              efectos={efectosNuevos}
              doctorName={doctors[0]?.name ?? ""}
              onCountClick={handleEfectoClick}
            />
            <EfectoGroup
              titulo="Efectos Esperados"
              tipo="esperado"
              efectos={efectosEsperados}
              doctorName={doctors[1]?.name ?? ""}
              onCountClick={handleEfectoClick}
            />
            <EfectoGroup
              titulo="Efectos Justificados"
              tipo="justificado"
              efectos={efectosJustificados}
              doctorName={doctors[2]?.name ?? ""}
              onCountClick={handleEfectoClick}
            />
          </TabsContent>

          <TabsContent value="cohort" className="space-y-6">
            <section ref={mediaRef}>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Multimedia del cohort
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {cohortUploads.length} {cohortUploads.length === 1 ? "upload" : "uploads"} con análisis IA
                    {selectedEfecto && ` · filtrado por "${selectedEfecto.nombre}"`}
                  </p>
                </div>
                {selectedEfecto && (
                  <button
                    onClick={() => setSelectedEfectoId(null)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <X className="h-3 w-3" />
                    Quitar filtro
                  </button>
                )}
              </div>
              {cohortUploads.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
                  No hay uploads disponibles.
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {cohortUploads.map((u) => (
                    <MediaCard key={u.id} upload={u} />
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="paciente" className="space-y-6">
            <section>
              <PatientsTable uploads={mediaUploads} />
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

type EfectoTipo = "nuevo" | "esperado" | "justificado";

const TIPO_STYLES: Record<EfectoTipo, { border: string; bgGrad: string; iconBg: string; iconColor: string; chipBg: string; chipText: string; label: string }> = {
  nuevo: {
    border: "border-warning/40",
    bgGrad: "from-warning/10 via-warning/5 to-transparent",
    iconBg: "bg-warning/20",
    iconColor: "text-warning-foreground",
    chipBg: "bg-warning/20",
    chipText: "text-warning-foreground",
    label: "Efecto Nuevo",
  },
  esperado: {
    border: "border-primary/40",
    bgGrad: "from-primary/10 via-primary/5 to-transparent",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    chipBg: "bg-primary/20",
    chipText: "text-primary",
    label: "Efecto Esperado",
  },
  justificado: {
    border: "border-success/40",
    bgGrad: "from-success/10 via-success/5 to-transparent",
    iconBg: "bg-success/20",
    iconColor: "text-success",
    chipBg: "bg-success/20",
    chipText: "text-success",
    label: "Efecto Justificado",
  },
};

function EfectoGroup({
  titulo,
  tipo,
  efectos,
  doctorName,
  onCountClick,
}: {
  titulo: string;
  tipo: EfectoTipo;
  efectos: Efecto[];
  doctorName: string;
  onCountClick: (id: string) => void;
}) {
  if (efectos.length === 0) return null;
  const styles = TIPO_STYLES[tipo];
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </h2>
      <div className="space-y-3">
        {efectos.map((e) => (
          <div
            key={e.id}
            className={`overflow-hidden rounded-2xl border ${styles.border} bg-gradient-to-r ${styles.bgGrad}`}
          >
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconColor}`}>
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full ${styles.chipBg} px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles.chipText}`}>
                      {styles.label}
                    </span>
                    {doctorName && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                        <ShieldCheck className="h-3 w-3" />
                        Validado · {doctorName}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{e.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{e.descripcion}</p>
                </div>
              </div>
              <button
                onClick={() => onCountClick(e.id)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary hover:bg-secondary"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-foreground">
                    {e.patient_count} {e.patient_count === 1 ? "paciente" : "pacientes"}
                  </div>
                  <div className="text-xs text-primary">Ver archivos →</div>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
