import { APP_TIMEZONE } from './timezone'

// Aba "Enviadas" do portal da paciente (ACO-104).

const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: APP_TIMEZONE })

// "6 out" (protótipo: "Enviada em 6 out").
export function formatDayMonth(iso?: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return dayMonth.format(date).replace('.', '').replace(' de ', ' ')
}

export function submittedStatusMeta(status: string): { label: string, variant: 'positive' | 'neutral' } {
  return status === 'reviewed'
    ? { label: 'Revisada', variant: 'positive' }
    : { label: 'Aguardando revisão', variant: 'neutral' }
}

export type PatientActivitiesTab = 'pendentes' | 'enviadas'

export function patientActivitiesTab(value: unknown): PatientActivitiesTab {
  return value === 'enviadas' ? 'enviadas' : 'pendentes'
}
