export type MediaType = "selfie" | "audio" | "video" | "text";
export type Severity = "ok" | "low" | "medium" | "high";

export interface MediaUpload {
  id: string;
  patientId?: string;
  patient: string;
  patientInitials: string;
  day: number;
  type: MediaType;
  thumbnail?: string;
  duration?: string;
  uploadedAt: string;
  aiInsight: string;
  aiTags: { label: string; severity: Severity }[];
  aiConfidence: number;
  aiAnalysis?: AnalysisInsight;
}

export type AlertLevel = "ninguna" | "baja" | "media" | "alta" | string;

export interface AnalysisSignal {
  name: string;
  description: string;
  category?: string;
}

export interface AnalysisInsight {
  alertLevel?: AlertLevel;
  signals: AnalysisSignal[];
}

export interface Patient {
  id: string;
  name: string;
  initials: string;
  age: number;
  enrolledDay: number;
  adherence: number;
  status: "active" | "at-risk" | "dropped";
  lastUpload: string;
  flags: string[];
  timeline: TimelineEvent[];
  gender?: string | null;
  weightKg?: number | null;
  city?: string | null;
  diagnosis?: string | null;
  treatmentStartDate?: string | null;
}

export interface TimelineEvent {
  day: number;
  type: MediaType;
  severity: Severity;
  note: string;
}

export const TIMELINE_DAYS = 60;

export const retentionData = [
  { day: "D1", pacientes: 100 },
  { day: "D2", pacientes: 88 },
  { day: "D3", pacientes: 76 },
  { day: "D5", pacientes: 64 },
  { day: "D10", pacientes: 52 },
  { day: "D20", pacientes: 41 },
  { day: "D30", pacientes: 33 },
  { day: "D45", pacientes: 24 },
  { day: "D60", pacientes: 18 },
];

export const adherenceByCategory = [
  { category: "Selfies", completado: 82 },
  { category: "Audio", completado: 67 },
  { category: "Video", completado: 54 },
  { category: "Cuestionario", completado: 71 },
];

export const cohortStats = {
  totalPacientes: 100,
  activos: 73,
  enRiesgo: 12,
  abandonaron: 15,
  adherenciaPromedio: 71,
  uploadsHoy: 48,
};

export const mediaUploads: MediaUpload[] = [
  {
    id: "u1",
    patient: "Martín G.",
    patientInitials: "MG",
    day: 12,
    type: "selfie",
    thumbnail:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=70",
    uploadedAt: "hace 12 min",
    aiInsight:
      "Postura facial estable. Se detecta leve asimetría en la sonrisa, consistente con observaciones previas.",
    aiTags: [
      { label: "Asimetría leve", severity: "low" },
      { label: "Estable", severity: "ok" },
    ],
    aiConfidence: 0.86,
  },
  {
    id: "u2",
    patient: "Candela R.",
    patientInitials: "CR",
    day: 8,
    type: "audio",
    duration: "0:42",
    uploadedAt: "hace 1 h",
    aiInsight:
      "Voz con pausas prolongadas y volumen bajo. Posible signo de fatiga vocal o cansancio generalizado.",
    aiTags: [
      { label: "Fatiga", severity: "medium" },
      { label: "Volumen bajo", severity: "low" },
    ],
    aiConfidence: 0.78,
  },
  {
    id: "u3",
    patient: "Delfina P.",
    patientInitials: "DP",
    day: 21,
    type: "video",
    thumbnail:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&q=70",
    duration: "0:18",
    uploadedAt: "hace 2 h",
    aiInsight:
      "Movimiento involuntario en mano derecha al sostener objeto. Patrón compatible con temblor de reposo leve.",
    aiTags: [
      { label: "Temblor", severity: "high" },
      { label: "Mano derecha", severity: "medium" },
    ],
    aiConfidence: 0.91,
  },
  {
    id: "u4",
    patient: "Joaquín M.",
    patientInitials: "JM",
    day: 5,
    type: "selfie",
    thumbnail:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=70",
    uploadedAt: "hace 3 h",
    aiInsight:
      "Coloración facial normal. Ojos con leve enrojecimiento, podría indicar falta de descanso.",
    aiTags: [
      { label: "Cansancio", severity: "low" },
    ],
    aiConfidence: 0.72,
  },
  {
    id: "u5",
    patient: "Sofía L.",
    patientInitials: "SL",
    day: 14,
    type: "audio",
    duration: "1:05",
    uploadedAt: "hace 4 h",
    aiInsight:
      "Tono y articulación normales. Reporta sensación de mejora en energía respecto a la semana anterior.",
    aiTags: [{ label: "Estable", severity: "ok" }],
    aiConfidence: 0.94,
  },
  {
    id: "u6",
    patient: "Tomás V.",
    patientInitials: "TV",
    day: 30,
    type: "video",
    thumbnail:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400&q=70",
    duration: "0:25",
    uploadedAt: "ayer",
    aiInsight:
      "Marcha con leve arrastre del pie izquierdo. Sin signos de inestabilidad postural.",
    aiTags: [
      { label: "Marcha alterada", severity: "medium" },
    ],
    aiConfidence: 0.83,
  },
];

const patientsBase: Omit<Patient, "timeline">[] = [
  {
    id: "p1",
    name: "Martín García",
    initials: "MG",
    age: 64,
    enrolledDay: 12,
    adherence: 92,
    status: "active",
    lastUpload: "hace 12 min",
    flags: ["Asimetría leve"],
  },
  {
    id: "p2",
    name: "Candela Romero",
    initials: "CR",
    age: 58,
    enrolledDay: 8,
    adherence: 74,
    status: "active",
    lastUpload: "hace 1 h",
    flags: ["Fatiga"],
  },
  {
    id: "p3",
    name: "Delfina Paz",
    initials: "DP",
    age: 71,
    enrolledDay: 21,
    adherence: 61,
    status: "at-risk",
    lastUpload: "hace 2 h",
    flags: ["Temblor"],
  },
  {
    id: "p4",
    name: "Joaquín Méndez",
    initials: "JM",
    age: 49,
    enrolledDay: 5,
    adherence: 88,
    status: "active",
    lastUpload: "hace 3 h",
    flags: [],
  },
  {
    id: "p5",
    name: "Sofía López",
    initials: "SL",
    age: 55,
    enrolledDay: 14,
    adherence: 95,
    status: "active",
    lastUpload: "hace 4 h",
    flags: [],
  },
  {
    id: "p6",
    name: "Tomás Vidal",
    initials: "TV",
    age: 67,
    enrolledDay: 30,
    adherence: 48,
    status: "at-risk",
    lastUpload: "ayer",
    flags: ["Marcha alterada"],
  },
  {
    id: "p7",
    name: "Lucía Fernández",
    initials: "LF",
    age: 62,
    enrolledDay: 18,
    adherence: 22,
    status: "dropped",
    lastUpload: "hace 9 días",
    flags: ["Sin contacto"],
  },
];

const timelineSeeds: Record<string, TimelineEvent[]> = {
  p1: [
    { day: 1, type: "selfie", severity: "ok", note: "Baseline. Postura simétrica." },
    { day: 3, type: "audio", severity: "ok", note: "Voz clara, sin alteraciones." },
    { day: 7, type: "selfie", severity: "low", note: "Asimetría facial leve detectada." },
    { day: 12, type: "video", severity: "low", note: "Movilidad normal, leve fatiga." },
    { day: 20, type: "selfie", severity: "low", note: "Asimetría se mantiene estable." },
    { day: 30, type: "audio", severity: "ok", note: "Reporta mejora subjetiva." },
    { day: 45, type: "video", severity: "ok", note: "Marcha estable." },
    { day: 58, type: "selfie", severity: "ok", note: "Sin nuevos hallazgos." },
  ],
  p2: [
    { day: 1, type: "selfie", severity: "ok", note: "Baseline normal." },
    { day: 4, type: "audio", severity: "low", note: "Volumen ligeramente bajo." },
    { day: 8, type: "audio", severity: "medium", note: "Fatiga vocal notoria." },
    { day: 15, type: "video", severity: "medium", note: "Lentitud al moverse." },
    { day: 22, type: "audio", severity: "low", note: "Mejora parcial con descanso." },
    { day: 35, type: "selfie", severity: "low", note: "Ojos cansados." },
    { day: 50, type: "audio", severity: "ok", note: "Voz estable." },
  ],
  p3: [
    { day: 1, type: "selfie", severity: "ok", note: "Baseline." },
    { day: 5, type: "video", severity: "low", note: "Leve temblor en reposo." },
    { day: 12, type: "video", severity: "medium", note: "Temblor más marcado." },
    { day: 21, type: "video", severity: "high", note: "Temblor compatible con reposo, mano derecha." },
    { day: 28, type: "audio", severity: "medium", note: "Voz monótona." },
    { day: 40, type: "video", severity: "high", note: "Temblor persistente." },
    { day: 55, type: "selfie", severity: "medium", note: "Expresión facial reducida." },
  ],
  p4: [
    { day: 1, type: "selfie", severity: "ok", note: "Baseline." },
    { day: 5, type: "selfie", severity: "low", note: "Cansancio leve." },
    { day: 10, type: "audio", severity: "ok", note: "Sin alteraciones." },
    { day: 18, type: "video", severity: "ok", note: "Coordinación normal." },
    { day: 30, type: "selfie", severity: "ok", note: "Buen estado general." },
    { day: 45, type: "audio", severity: "ok", note: "Reporta energía estable." },
    { day: 60, type: "video", severity: "ok", note: "Cierre del seguimiento." },
  ],
  p5: [
    { day: 1, type: "selfie", severity: "ok", note: "Baseline." },
    { day: 6, type: "audio", severity: "ok", note: "Articulación normal." },
    { day: 14, type: "audio", severity: "ok", note: "Reporta mejora en energía." },
    { day: 25, type: "video", severity: "ok", note: "Movilidad plena." },
    { day: 40, type: "selfie", severity: "ok", note: "Sin hallazgos." },
    { day: 55, type: "audio", severity: "ok", note: "Estable." },
  ],
  p6: [
    { day: 1, type: "selfie", severity: "ok", note: "Baseline." },
    { day: 8, type: "video", severity: "low", note: "Marcha levemente lenta." },
    { day: 18, type: "video", severity: "medium", note: "Arrastre de pie izquierdo." },
    { day: 30, type: "video", severity: "medium", note: "Marcha alterada confirmada." },
    { day: 42, type: "audio", severity: "low", note: "Voz cansada." },
    { day: 55, type: "video", severity: "high", note: "Inestabilidad postural creciente." },
  ],
  p7: [
    { day: 1, type: "selfie", severity: "ok", note: "Baseline." },
    { day: 4, type: "audio", severity: "low", note: "Reporta desgano." },
    { day: 10, type: "selfie", severity: "medium", note: "Cansancio acentuado." },
    { day: 18, type: "selfie", severity: "high", note: "Última carga registrada." },
  ],
};

export const patients: Patient[] = patientsBase.map((p) => ({
  ...p,
  timeline: timelineSeeds[p.id] ?? [],
}));

export interface Doctor {
  id: string;
  name: string;
  initials: string;
  specialty: string;
}

export const doctors: Doctor[] = [
  { id: "d1", name: "Dra. M. Álvarez", initials: "MA", specialty: "Endocrinología" },
  { id: "d2", name: "Dr. F. Castillo", initials: "FC", specialty: "Farmacovigilancia" },
  { id: "d3", name: "Dra. L. Pereyra", initials: "LP", specialty: "Medicina Interna" },
  { id: "d4", name: "Dr. J. Sosa", initials: "JS", specialty: "Neurología" },
];