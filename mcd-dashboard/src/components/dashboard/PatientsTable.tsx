import { AlertTriangle, CheckCircle2, ChevronDown, MapPin, Stethoscope, XCircle } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { type MediaUpload, type Patient } from "@/lib/dashboard-data";
import { usePatients } from "@/hooks/use-patients";
import { PatientSwimlane } from "./PatientSwimlane";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig: Record<
  Patient["status"],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  active: {
    label: "Activo",
    icon: CheckCircle2,
    className: "bg-success/10 text-success",
  },
  "at-risk": {
    label: "En riesgo",
    icon: AlertTriangle,
    className: "bg-warning/15 text-warning-foreground",
  },
  dropped: {
    label: "Abandonó",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
  },
};

function adherenceColor(value: number) {
  if (value >= 75) return "bg-success";
  if (value >= 50) return "bg-warning";
  return "bg-destructive";
}

export function PatientsTable({ uploads = [] }: { uploads?: MediaUpload[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [diagnosisFilter, setDiagnosisFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const { data: patients, loading, error } = usePatients();

  const diagnoses = useMemo(() => {
    const set = new Set<string>();
    (patients ?? []).forEach((p) => p.diagnosis && set.add(p.diagnosis));
    return Array.from(set).sort();
  }, [patients]);

  const visiblePatients = useMemo(() => {
    const list = (patients ?? []).filter((p) => {
      if (diagnosisFilter !== "__all__" && p.diagnosis !== diagnosisFilter) return false;
      if (statusFilter !== "__all__" && p.status !== statusFilter) return false;
      return true;
    });
    return list.sort((a, b) => {
      const aC = a.name.toLowerCase().startsWith("candela") ? 0 : 1;
      const bC = b.name.toLowerCase().startsWith("candela") ? 0 : 1;
      return aC - bC;
    });
  }, [patients, diagnosisFilter, statusFilter]);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Pacientes</h3>
          <p className="text-sm text-muted-foreground">
            {visiblePatients.length} {visiblePatients.length === 1 ? "paciente" : "pacientes"} · adherencia y datos clínicos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los estados</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="at-risk">En riesgo</SelectItem>
              <SelectItem value="dropped">Abandonó</SelectItem>
            </SelectContent>
          </Select>
          <Select value={diagnosisFilter} onValueChange={setDiagnosisFilter}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder="Diagnóstico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los diagnósticos</SelectItem>
              {diagnoses.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {error && (
        <div className="border-b border-border bg-destructive/5 px-6 py-3 text-sm text-destructive">
          Error al cargar pacientes: {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-6 py-3 font-medium">Paciente</th>
              <th className="px-6 py-3 font-medium">Edad</th>
              <th className="px-6 py-3 font-medium">Diagnóstico</th>
              <th className="px-6 py-3 font-medium">Ciudad</th>
              <th className="px-6 py-3 font-medium">Adherencia</th>
              <th className="px-6 py-3 font-medium">Estado</th>
              <th className="px-6 py-3 font-medium">Señales IA</th>
              <th className="px-6 py-3 font-medium">Última carga</th>
              <th className="px-6 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  Cargando pacientes…
                </td>
              </tr>
            )}
            {!loading && visiblePatients.length === 0 && !error && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No hay pacientes en la tabla.
                </td>
              </tr>
            )}
            {visiblePatients.map((p) => {
              const status = statusConfig[p.status];
              const StatusIcon = status.icon;
              const isOpen = expandedId === p.id;
              return (
                <Fragment key={p.id}>
                <tr
                  onClick={() => setExpandedId(isOpen ? null : p.id)}
                  className={`cursor-pointer border-b border-border/60 transition-colors last:border-0 ${isOpen ? "bg-secondary/60" : "hover:bg-secondary/40"}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                        {p.initials}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {p.name}
                        </div>
                        {p.gender && (
                          <div className="text-xs capitalize text-muted-foreground">
                            {p.gender}
                            {p.weightKg ? ` · ${p.weightKg} kg` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 tabular-nums text-foreground">
                    {p.age && p.age > 0 ? `${p.age} a.` : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {p.diagnosis ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-foreground">
                        <Stethoscope className="h-3 w-3 text-primary" />
                        {p.diagnosis}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {p.city ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {p.city}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${adherenceColor(p.adherence)}`}
                          style={{ width: `${p.adherence}%` }}
                        />
                      </div>
                      <span className="w-10 tabular-nums text-foreground">
                        {p.adherence}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {p.flags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        p.flags.map((f) => (
                          <span
                            key={f}
                            className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-foreground"
                          >
                            {f}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {p.lastUpload}
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    <ChevronDown
                      className={`inline h-4 w-4 transition-transform ${isOpen ? "rotate-180 text-primary" : ""}`}
                    />
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-border/60 last:border-0">
                    <td colSpan={9} className="p-0">
                      <PatientSwimlane
                        patient={p}
                        onClose={() => setExpandedId(null)}
                        uploads={uploads.filter(
                          (u) =>
                            u.patient === p.name ||
                            u.patientInitials === p.initials,
                        )}
                      />
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}