import type { Activity, Patient, PatientCheckin } from '~/types'
import { checkinDay } from './checkin'
import { APP_TIMEZONE, zonedParts } from './timezone'
import { relativeSince } from './patient-list'

// Regras da visão geral da ficha (/patients/[id]): humor, atividades
// respondidas, selo do vínculo e formatos curtos. Puras, para testar sem a página.

const DAY_MS = 24 * 60 * 60 * 1000

// Humor dos últimos `days` dias a partir dos check-ins (escala 1–5).
export function moodSummary(checkins: PatientCheckin[], now: Date = new Date(), days = 30) {
  const from = checkinDay(new Date(now.getTime() - (days - 1) * DAY_MS))
  const recent = checkins
    .filter(c => c.day >= from && c.day <= checkinDay(now))
    .sort((a, b) => a.day.localeCompare(b.day))
  const series = recent.map(c => c.mood)
  const avg = series.length ? series.reduce((a, b) => a + b, 0) / series.length : null
  return {
    series,
    count: series.length,
    avgLabel: avg == null ? null : avg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  }
}

// Respondidas = enviadas ou já revisadas; canceladas não entram na conta.
export function activityResponse(activities: Activity[]) {
  const counted = activities.filter(a => a.status !== 'canceled')
  const responded = counted.filter(a => a.status === 'submitted' || a.status === 'reviewed').length
  const total = counted.length
  return { responded, total, pct: total ? Math.round((responded / total) * 100) : null }
}

// Selo ao lado do nome. A duração do vínculo conta do aceite do consentimento.
export function relationshipBadge(patient: Patient, now: Date = new Date()): { label: string, variant: 'positive' | 'neutral' | 'warning' } {
  switch (patient.relationshipStatus) {
    case 'active': {
      const since = patient.healthConsent?.accepted ? relativeSince(patient.healthConsent.decidedAt, now) : ''
      const duration = since.replace(/^há /, '')
      return { label: duration && duration !== 'desde hoje' ? `Vínculo ativo · ${duration}` : 'Vínculo ativo', variant: 'positive' }
    }
    case 'pending': return { label: 'Aguardando aceite', variant: 'warning' }
    case 'paused': return { label: 'Vínculo pausado', variant: 'neutral' }
    case 'ended': return { label: 'Vínculo encerrado', variant: 'neutral' }
    case 'transferred': return { label: 'Encaminhada', variant: 'neutral' }
    default: return { label: 'Vínculo não informado', variant: 'neutral' }
  }
}

// Esconde o miolo do telefone, como no protótipo: "(11) 9••••-••42".
// Mantém DDD (e DDI, se houver), o primeiro dígito do número e os dois últimos.
export function maskPhone(phone: string): string {
  const total = phone.replace(/\D/g, '').length
  if (total < 6) return phone
  let index = -1
  return phone.replace(/\d/g, (digit) => {
    index += 1
    return index >= total - 8 && index < total - 2 ? '•' : digit
  })
}

function hourLabel(iso: string) {
  const { hour, minute } = zonedParts(iso)
  return `${hour}h${String(minute).padStart(2, '0')}`
}

function dayOffset(iso: string, now: Date) {
  const day = (value: Date | string) => Date.parse(`${zonedParts(value).day}T00:00:00Z`)
  return Math.round((day(iso) - day(now)) / DAY_MS)
}

const shortDay = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: APP_TIMEZONE })
const shortDayLabel = (iso: string) => shortDay.format(new Date(iso)).replace(' de ', ' ').replace('.', '')

// "Hoje, 14h00" / "Amanhã, 9h30" / "16 out, 14h00" (próxima sessão).
export function sessionWhenLabel(iso: string, now: Date = new Date()): string {
  const offset = dayOffset(iso, now)
  const day = offset === 0 ? 'Hoje' : offset === 1 ? 'Amanhã' : shortDayLabel(iso)
  return `${day}, ${hourLabel(iso)}`
}

// "hoje 14h00" / "ontem" / "2 out" (coluna da linha do tempo).
export function timelineWhenLabel(iso: string, now: Date = new Date()): string {
  const offset = dayOffset(iso, now)
  if (offset === 0) return `hoje ${hourLabel(iso)}`
  if (offset === -1) return 'ontem'
  return shortDayLabel(iso)
}
