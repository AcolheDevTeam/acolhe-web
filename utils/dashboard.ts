import type { Activity, Appointment } from '~/types'
import { appointmentStatusLabel, formatDate } from './format'
import { addCalendarDays, APP_TIMEZONE, weekStart, zonedDay, zonedParts } from './timezone'

// Regras de apresentação do Início da psicóloga (pages/dashboard.vue). Tudo sai
// dos endpoints atuais (agendamentos e atividades); nada é estimado.

/** Situação de uma sessão do dia na agenda do Início (cor do ponto e do texto). */
export type AgendaRowState = 'done' | 'miss' | 'now' | 'next' | 'past'

export interface AgendaRow {
  appointment: Appointment
  state: AgendaRowState
  label: string
}

// Cancelada não ocupa a agenda do dia; falta aparece (o protótipo a mostra).
const AGENDA_STATUSES = new Set(['scheduled', 'confirmed', 'completed', 'no_show'])

export function isAgendaAppointment(appointment: Appointment): boolean {
  return AGENDA_STATUSES.has(appointment.status)
}

export function agendaRow(appointment: Appointment, now: Date = new Date()): AgendaRow {
  if (appointment.status === 'completed') return { appointment, state: 'done', label: 'Realizada' }
  if (appointment.status === 'no_show') return { appointment, state: 'miss', label: 'Falta' }

  const start = new Date(appointment.scheduledFor).getTime()
  const end = start + appointment.durationMinutes * 60_000
  const t = now.getTime()
  if (t >= start && t < end) return { appointment, state: 'now', label: 'Agora' }
  if (t < start) {
    const minutes = Math.ceil((start - t) / 60_000)
    const label = minutes < 60 ? `Em ${minutes} min` : `Em ${Math.round(minutes / 60)} h`
    return { appointment, state: 'next', label }
  }
  // Já passou e ninguém registrou: mostra o status como está na API.
  return { appointment, state: 'past', label: appointmentStatusLabel(appointment.status) }
}

/** Sessões de hoje (fuso do app), em ordem de horário. */
export function agendaToday(appointments: Appointment[], now: Date = new Date()): AgendaRow[] {
  const today = zonedDay(now)
  return appointments
    .filter(a => isAgendaAppointment(a) && zonedDay(a.scheduledFor) === today)
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
    .map(a => agendaRow(a, now))
}

export interface WeekDayCount {
  day: string
  short: string
  long: string
  count: number
  isToday: boolean
}

const SHORT_DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
const LONG_DAYS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']

/** Sessões por dia da semana corrente (segunda a domingo). */
export function weekCounts(appointments: Appointment[], now: Date = new Date()): WeekDayCount[] {
  const today = zonedDay(now)
  const monday = weekStart(today)
  const days = SHORT_DAYS.map((_, i) => addCalendarDays(monday, i))
  const counts = new Map(days.map(d => [d, 0]))
  for (const a of appointments) {
    if (!isAgendaAppointment(a)) continue
    const day = zonedDay(a.scheduledFor)
    if (counts.has(day)) counts.set(day, counts.get(day)! + 1)
  }
  return days.map((day, i) => ({ day, short: SHORT_DAYS[i]!, long: LONG_DAYS[i]!, count: counts.get(day)!, isToday: day === today }))
}

/** Sessões (não canceladas) no mês corrente, no fuso do app. */
export function sessionsThisMonth(appointments: Appointment[], now: Date = new Date()): number {
  const month = zonedDay(now).slice(0, 7)
  return appointments.filter(a => isAgendaAppointment(a) && zonedDay(a.scheduledFor).slice(0, 7) === month).length
}

const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: APP_TIMEZONE })

export function currentMonthName(now: Date = new Date()): string {
  return monthFormat.format(now)
}

/**
 * Percentual de atividades respondidas (respondida ou já revisada) sobre as
 * atribuídas, sem contar as canceladas. `null` quando não há nenhuma.
 */
export function responseRate(activities: Activity[]): number | null {
  const considered = activities.filter(a => a.status !== 'canceled')
  if (!considered.length) return null
  const answered = considered.filter(a => a.status === 'submitted' || a.status === 'reviewed').length
  return Math.round((answered / considered.length) * 100)
}

/** Respostas aguardando revisão, da mais antiga para a mais recente. */
export function awaitingReview(activities: Activity[]): Activity[] {
  return activities
    .filter(a => a.status === 'submitted')
    .sort((a, b) => new Date(a.respondedAt ?? 0).getTime() - new Date(b.respondedAt ?? 0).getTime())
}

/** Quando algo aconteceu, em linguagem curta: "há 4 horas", "ontem, 21h". */
export function relativeTimeLabel(iso?: string | null, now: Date = new Date()): string {
  if (!iso) return ''
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000)
  if (minutes < 1) return 'agora há pouco'
  if (minutes < 60) return `há ${minutes} min`
  const day = zonedDay(then)
  if (day === zonedDay(now)) {
    const hours = Math.floor(minutes / 60)
    return hours === 1 ? 'há 1 hora' : `há ${hours} horas`
  }
  if (day === addCalendarDays(zonedDay(now), -1)) {
    const { hour, minute } = zonedParts(then)
    return `ontem, ${hour}h${minute ? String(minute).padStart(2, '0') : ''}`
  }
  return formatDate(iso)
}
