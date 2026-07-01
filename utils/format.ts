// Helpers de apresentação (auto-importados pelo Nuxt em utils/).

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

const dtf = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const tf = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dtf.format(d)
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
    case 'done':
      return { label: 'Realizada', variant: 'secondary' }
    case 'missed':
      return { label: 'Falta', variant: 'destructive' }
    case 'scheduled':
      return { label: 'Agendada', variant: 'outline' }
    default:
      return { label: status ?? '—', variant: 'outline' }
  }
}

export function activityStatusMeta(status?: string): { label: string, variant: BadgeVariant } {
  switch (status) {
    case 'responded':
      return { label: 'Respondida', variant: 'secondary' }
    case 'reviewed':
      return { label: 'Revisada', variant: 'outline' }
    case 'assigned':
      return { label: 'Atribuída', variant: 'outline' }
    case 'overdue':
      return { label: 'Atrasada', variant: 'destructive' }
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
