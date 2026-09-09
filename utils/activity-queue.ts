import type { Activity } from '~/types'
import { formatDate, formatDateTime } from './format'

// Agrupamento da fila de atividades da psicóloga (pages/activities/index.vue).
//
// A API devolve os status `pending`, `in_progress`, `submitted`, `reviewed`,
// `expired` e `canceled` e nunca marca atraso sozinha: "atrasada" é uma
// atividade ainda aberta cujo prazo já passou. Este módulo traduz esse
// vocabulário para as situações que a psicóloga vê, sem criar status na API.

export type ActivityQueueGroup = 'awaiting_review' | 'overdue' | 'assigned' | 'reviewed' | 'closed'

export interface ActivityQueueSection {
  key: ActivityQueueGroup
  label: string
  rows: Activity[]
}

// Ordem de acionabilidade: o que exige ação da psicóloga vem primeiro.
export const ACTIVITY_QUEUE_LABELS: Record<ActivityQueueGroup, string> = {
  awaiting_review: 'Aguardando revisão',
  overdue: 'Atrasadas',
  assigned: 'Atribuídas',
  reviewed: 'Revisadas',
  closed: 'Encerradas sem resposta',
}

const OPEN_STATUSES = new Set(['pending', 'in_progress'])

export function isActivityOverdue(activity: Pick<Activity, 'status' | 'dueAt'>, now: Date = new Date()): boolean {
  if (!OPEN_STATUSES.has(activity.status) || !activity.dueAt) return false
  const due = new Date(activity.dueAt)
  return !Number.isNaN(due.getTime()) && due.getTime() < now.getTime()
}

export function activityQueueGroup(activity: Pick<Activity, 'status' | 'dueAt'>, now: Date = new Date()): ActivityQueueGroup | null {
  switch (activity.status) {
    case 'submitted':
      return 'awaiting_review'
    case 'reviewed':
      return 'reviewed'
    case 'pending':
    case 'in_progress':
      return isActivityOverdue(activity, now) ? 'overdue' : 'assigned'
    case 'expired':
    case 'canceled':
      return 'closed'
    default:
      // Status desconhecido: não escondemos a atividade, ela cai em "Atribuídas".
      return 'assigned'
  }
}

// Devolve só as seções com itens, na ordem de ACTIVITY_QUEUE_LABELS.
export function groupActivityQueue(list: Activity[], now: Date = new Date()): ActivityQueueSection[] {
  const buckets = new Map<ActivityQueueGroup, Activity[]>()
  for (const activity of list) {
    const key = activityQueueGroup(activity, now)
    if (!key) continue
    const rows = buckets.get(key) ?? []
    rows.push(activity)
    buckets.set(key, rows)
  }
  return (Object.keys(ACTIVITY_QUEUE_LABELS) as ActivityQueueGroup[])
    .filter((key) => buckets.has(key))
    .map((key) => ({ key, label: ACTIVITY_QUEUE_LABELS[key], rows: buckets.get(key)! }))
}

// Linha secundária da atividade quando a API não manda `summary`.
export function activitySummary(activity: Activity, now: Date = new Date()): string {
  if (activity.summary) return activity.summary
  switch (activity.status) {
    case 'submitted':
      return activity.respondedAt ? `Respondida em ${formatDateTime(activity.respondedAt)}` : 'Respondida'
    case 'reviewed':
      return activity.respondedAt ? `Revisada · respondida em ${formatDate(activity.respondedAt)}` : 'Revisada'
    case 'pending':
    case 'in_progress':
      if (!activity.dueAt) return 'Sem prazo'
      return isActivityOverdue(activity, now)
        ? `Prazo venceu em ${formatDate(activity.dueAt)}`
        : `Prazo ${formatDate(activity.dueAt)}`
    case 'expired':
      return 'Prazo encerrado sem resposta'
    case 'canceled':
      return 'Cancelada'
    default:
      return activity.status
  }
}
