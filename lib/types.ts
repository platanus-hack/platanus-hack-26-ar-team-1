export interface Doctor {
  id: string
  name: string
  email: string | null
  created_at: string
}

export interface Patient {
  id: string
  doctor_id: string | null
  name: string
  phone_number: string
  drug_name: string
  status: "pending" | "in_progress" | "completed" | "non_responsive"
  completed_at: string | null
  created_at: string
}

export interface Conversation {
  id: string
  patient_id: string
  direction: "inbound" | "outbound"
  message_type: "text" | "audio" | "image" | "video" | "document"
  content: string | null
  media_url: string | null
  media_type: string | null
  whatsapp_message_id: string | null
  created_at: string
}

export interface QuestionnaireResponse {
  id: string
  patient_id: string
  question_number: number
  question_text: string
  answer_text: string | null
  media_url: string | null
  created_at: string
}

export interface LabReport {
  id: string
  drug_name: string
  doctor_id: string | null
  generated_at: string
  patient_count: number | null
  completed_count: number | null
  non_responsive_count: number | null
  report_json: Record<string, unknown> | null
}

export interface DashboardStats {
  totalPatients: number
  completedPatients: number
  inProgressPatients: number
  nonResponsivePatients: number
  pendingPatients: number
  totalConversations: number
  mediaUploads: number
  completionRate: number
}
