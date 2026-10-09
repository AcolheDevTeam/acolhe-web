// Helpers de apresentação (auto-importados pelo Nuxt em utils/).
import { APP_TIMEZONE } from './timezone'

export function initials(name?: string | null): string {
  if (!name) return '—'
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Instantes saem no fuso do app (igual no SSR e no browser); datas puras
// (`YYYY-MM-DD`, ex.: nascimento) são dias de calendário e não mudam de dia.
const dtf = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: APP_TIMEZONE })
const calendarDtf = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
const tf = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE })

export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? calendarDtf.format(d) : dtf.format(d)
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : tf.format(d)
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return `${formatDate(iso)} · ${formatTime(iso)}`
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export function sessionStatusMeta(status?: string): { label: string, variant: BadgeVariant } {
  switch (status) {
    case 'completed':
      return { label: 'Realizada', variant: 'secondary' }
    case 'pending':
      return { label: 'Em registro', variant: 'outline' }
    default:
      return { label: status ?? '—', variant: 'outline' }
  }
}

export function activityStatusMeta(status?: string): { label: string, variant: BadgeVariant } {
  switch (status) {
    case 'submitted':
      return { label: 'Respondida', variant: 'secondary' }
    case 'reviewed':
      return { label: 'Revisada', variant: 'outline' }
    case 'pending':
    case 'in_progress':
      return { label: 'Atribuída', variant: 'outline' }
    case 'expired':
      return { label: 'Prazo encerrado', variant: 'destructive' }
    case 'canceled':
      return { label: 'Cancelada', variant: 'outline' }
    default:
      return { label: status ?? '—', variant: 'outline' }
  }
}

export function modalityLabel(m?: string): string {
  if (m === 'online') return 'Online'
  if (m === 'in_person') return 'Presencial'
  return m ?? '—'
}

export function patientStatusLabel(s?: string): string {
  if (s === 'active') return 'Ativo'
  if (s === 'onboarding') return 'Em onboarding'
  if (s === 'archived') return 'Arquivado'
  return s ?? '—'
}

export function appointmentStatusLabel(status: string): string {
  return ({ scheduled: 'Agendada', confirmed: 'Confirmada', completed: 'Realizada', canceled: 'Cancelada', no_show: 'Falta' } as Record<string, string>)[status] ?? status
}
