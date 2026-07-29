export type UserRole = 'platform_admin' | 'org_admin' | 'psychologist' | 'patient'

export interface User {
  id: string
  email: string
  role: UserRole
  organizationId: string | null
  name?: string
  crp?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
}

export type PatientStatus = 'active' | 'onboarding' | 'archived'

export interface Patient {
  id: string
  fullName: string
  status: PatientStatus | string
  createdAt: string
  // Campos clínicos (podem não vir na listagem enxuta).
  age?: number
  approach?: string // abordagem, ex.: "TCC"
  approachSince?: string // ex.: "há 7 meses"
  sessionsCount?: number
  adherence?: number // 0–100 (%)
  lastActivityLabel?: string // ex.: "Hoje, 14h"
  // Ficha (detalhe).
  email?: string
  phone?: string
  bond?: string // vínculo, ex.: "Ativo · particular"
  demand?: string // demanda clínica
  moodAvg?: number
  moodSeries?: number[]
  consentVersion?: string
  consentDate?: string
  nextSession?: Pick<Session, 'occurredAt' | 'modality' | 'durationMin'> | null
}

export type SessionModality = 'online' | 'in_person'
export type SessionStatus = 'pending' | 'completed'

export interface Session {
  id: string
  patientId: string
  patientName?: string
  number?: number // S-28
  occurredAt: string
  modality?: SessionModality | string
  durationMin?: number
  status: SessionStatus | string
  notes?: string
}

export type ActivityType = 'record' | 'scale' | 'checklist' | 'checkin'
export type ActivityStatus = 'pending' | 'in_progress' | 'submitted' | 'reviewed' | 'expired' | 'canceled'

export interface Activity {
  id: string
  patientId: string
  patientName?: string
  title: string
  type: ActivityType | string
  status: ActivityStatus | string
  dueAt?: string | null
  respondedAt?: string | null
  summary?: string // ex.: "Texto + escala · respondida ontem, 21h"
}

export interface ActivityTemplate {
  id: string
  title: string
  type: ActivityType | string
}

export type TimelineEventType = 'session' | 'activity' | 'note' | 'document'

export interface TimelineEvent {
  id: string
  type: TimelineEventType | string
  title: string
  description?: string
  at: string
  by?: string
}

export interface Appointment {
  id: string
  patientId: string
  psychologistId: string
  scheduledFor: string
  durationMinutes: number
  modality: SessionModality | string
  status: string
  createdAt: string
}

export interface Checkin {
  id: string
  patientId: string
  mood: number
  note?: string | null
  createdAt: string
}

export interface ClinicalDocument {
  id: string
  patientId: string
  psychologistId: string
  type: string
  pdfUrl?: string | null
  createdAt: string
}

export interface ActivityResponse {
  id: string
  assignmentId: string
  submittedAt?: string | null
  isDraft: boolean
  createdAt: string
}
