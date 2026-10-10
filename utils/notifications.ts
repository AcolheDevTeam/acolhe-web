// Caixa de notificações da psicóloga (ACO-99). A API manda só o tipo, a
// paciente e os ids do recurso; o texto e o link saem daqui, sem nada clínico.
import type { AppNotification, NotificationKind, NotificationPreference } from '~/schemas/notification'
import { notificationKinds } from '~/schemas/notification'
import { apiErrorMessage } from './api-error'
import { addCalendarDays, APP_TIMEZONE, zonedDay } from './timezone'

interface KindMeta {
  /** Nome do evento: rótulo da linha e da matriz de preferências. */
  label: string
  /** O que aconteceu, depois do nome da paciente. */
  action: string
  /** Descrição na matriz de preferências. */
  description: string
}

export const notificationKindMeta: Record<NotificationKind, KindMeta> = {
  activity_submitted: {
    label: 'Resposta enviada',
    action: 'enviou a resposta de uma atividade.',
    description: 'Uma paciente respondeu uma atividade',
  },
  appointment_confirmed: {
    label: 'Presença confirmada',
    action: 'confirmou presença na sessão.',
    description: 'A paciente confirmou a próxima sessão',
  },
  invitation_accepted: {
    label: 'Convite aceito',
    action: 'aceitou o convite e criou a conta.',
    description: 'Uma paciente criou a conta pelo seu convite',
  },
}

/** Nome de quem fez a ação. Sem acesso ao cadastro, fica genérico. */
export function notificationWho(n: Pick<AppNotification, 'patientName'>): string {
  return n.patientName?.trim() || 'Paciente'
}

/** Para onde o item leva: a revisão, o agendamento ou a ficha da paciente. */
export function notificationLink(n: AppNotification): string {
  if (n.kind === 'activity_submitted' && n.activityAssignmentId) return `/activities/${n.activityAssignmentId}`
  if (n.kind === 'appointment_confirmed' && n.appointmentId) return `/appointments/${n.appointmentId}`
  return `/patients/${n.patientId}`
}

const longDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

/** Título do grupo de um dia: "Hoje", "Ontem" ou "segunda-feira, 5 de outubro". */
export function notificationDayTitle(day: string, now: Date | string = new Date()): string {
  const today = zonedDay(now)
  if (day === today) return 'Hoje'
  if (day === addCalendarDays(today, -1)) return 'Ontem'
  const label = longDay.format(new Date(`${day}T12:00:00Z`))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export interface NotificationGroup {
  day: string
  title: string
  items: AppNotification[]
}

/** Agrupa por dia no fuso do app, mantendo a ordem (mais novas primeiro). */
export function groupNotificationsByDay(items: AppNotification[], now: Date | string = new Date()): NotificationGroup[] {
  const groups: NotificationGroup[] = []
  for (const item of items) {
    const day = zonedDay(item.createdAt)
    let group = groups.at(-1)
    if (!group || group.day !== day) {
      group = { day, title: notificationDayTitle(day, now), items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', minute: '2-digit', hourCycle: 'h23', timeZone: APP_TIMEZONE })

/** Hora do evento, ex.: "9h04". O dia já está no título do grupo. */
export function notificationTime(iso: string): string {
  return timeFormat.format(new Date(iso)).replace(':', 'h')
}

export function unreadSummary(count: number): string {
  if (count === 0) return 'Tudo lido.'
  return count === 1 ? '1 não lida.' : `${count} não lidas.`
}

export function bellLabel(count: number): string {
  if (count === 0) return 'Notificações, nenhuma não lida'
  return count === 1 ? 'Notificações, 1 não lida' : `Notificações, ${count} não lidas`
}

/** Contador do sino: acima de 99 vira "99+". */
export function badgeCount(count: number): string {
  return count > 99 ? '99+' : String(count)
}

export function unreadKey(organizationId?: string | null): string {
  return `notifications-unread-${organizationId ?? 'none'}`
}

export type NotificationAction = 'load' | 'read' | 'read-all' | 'preferences' | 'save-preference'

/** Erro da caixa e das preferências em português, específico por ação (A6). */
export function notificationErrorMessage(error: unknown, action: NotificationAction): string {
  const byAction: Record<NotificationAction, string> = {
    'load': 'Não foi possível carregar as notificações. Tente de novo em instantes.',
    'read': 'Não foi possível marcar a notificação como lida. Tente de novo.',
    'read-all': 'Não foi possível marcar todas como lidas. Tente de novo.',
    'preferences': 'Não foi possível carregar suas preferências. Tente de novo em instantes.',
    'save-preference': 'Não foi possível salvar a preferência. O interruptor voltou ao que estava.',
  }
  return apiErrorMessage(error, {
    403: 'As notificações são só da equipe; a paciente não tem caixa de notificações.',
    404: action === 'read' ? 'Esta notificação não existe mais ou não é sua.' : byAction[action],
    default: byAction[action],
  })
}

export type NotificationChannel = 'inApp' | 'email'

/** Matriz completa na ordem dos eventos; o que a API não mandou fica no padrão. */
export function preferenceRows(saved: NotificationPreference[]): NotificationPreference[] {
  return notificationKinds.map(kind => saved.find(p => p.kind === kind) ?? { kind, inApp: true, email: false })
}

/** Troca um canal de um evento sem mexer no resto. */
export function withPreference(
  rows: NotificationPreference[],
  kind: NotificationKind,
  channel: NotificationChannel,
  value: boolean,
): NotificationPreference[] {
  return rows.map(p => p.kind === kind ? { ...p, [channel]: value } : p)
}
