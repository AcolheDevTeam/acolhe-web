import { describe, expect, it } from 'vitest'
import type { Activity, Appointment } from '~/types'
import { agendaRow, agendaToday, awaitingReview, relativeTimeLabel, responseRate, sessionsThisMonth, weekCounts } from '~/utils/dashboard'

// Sexta, 9 de outubro de 2026, 14h10 em São Paulo (17h10 UTC).
const now = new Date('2026-10-09T17:10:00Z')

const appt = (over: Partial<Appointment>): Appointment => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  patientId: 'p1',
  psychologistId: 'ps1',
  scheduledFor: '2026-10-09T17:00:00Z',
  durationMinutes: 50,
  modality: 'online',
  status: 'scheduled',
  createdAt: '2026-10-01T00:00:00Z',
  ...over,
})

const act = (over: Partial<Activity>): Activity => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  patientId: 'p1',
  title: 'RPD',
  type: 'record',
  status: 'pending',
  ...over,
})

describe('agendaRow', () => {
  it('marca a sessão em andamento como "Agora"', () => {
    expect(agendaRow(appt({}), now)).toMatchObject({ state: 'now', label: 'Agora' })
  })

  it('conta o tempo até as próximas', () => {
    expect(agendaRow(appt({ scheduledFor: '2026-10-09T19:00:00Z' }), now).label).toBe('Em 2 h')
    expect(agendaRow(appt({ scheduledFor: '2026-10-09T17:30:00Z' }), now).label).toBe('Em 20 min')
  })

  it('usa o status da API para realizada, falta e as que passaram sem registro', () => {
    expect(agendaRow(appt({ status: 'completed' }), now)).toMatchObject({ state: 'done', label: 'Realizada' })
    expect(agendaRow(appt({ status: 'no_show' }), now)).toMatchObject({ state: 'miss', label: 'Falta' })
    expect(agendaRow(appt({ scheduledFor: '2026-10-09T12:00:00Z', status: 'confirmed' }), now)).toMatchObject({ state: 'past', label: 'Confirmada' })
  })
})

describe('agendaToday', () => {
  it('fica só com o dia de hoje no fuso do app, sem canceladas, em ordem de horário', () => {
    const rows = agendaToday([
      appt({ id: 'tarde', scheduledFor: '2026-10-09T21:00:00Z' }),
      appt({ id: 'cedo', scheduledFor: '2026-10-09T12:00:00Z' }),
      appt({ id: 'cancelada', status: 'canceled' }),
      // 01h UTC do dia 10 ainda é dia 9 em São Paulo.
      appt({ id: 'noite', scheduledFor: '2026-10-10T01:00:00Z' }),
      appt({ id: 'amanha', scheduledFor: '2026-10-10T15:00:00Z' }),
    ], now)
    expect(rows.map(r => r.appointment.id)).toEqual(['cedo', 'tarde', 'noite'])
  })
})

describe('weekCounts e sessionsThisMonth', () => {
  const list = [
    appt({ scheduledFor: '2026-10-05T13:00:00Z' }), // segunda
    appt({ scheduledFor: '2026-10-09T13:00:00Z' }), // sexta (hoje)
    appt({ scheduledFor: '2026-10-09T15:00:00Z', status: 'canceled' }),
    appt({ scheduledFor: '2026-10-12T13:00:00Z' }), // semana seguinte
    appt({ scheduledFor: '2026-09-30T13:00:00Z' }), // mês anterior
  ]

  it('conta segunda a domingo e destaca hoje', () => {
    const week = weekCounts(list, now)
    expect(week.map(d => d.count)).toEqual([1, 0, 0, 0, 1, 0, 0])
    expect(week.find(d => d.isToday)?.short).toBe('sex')
  })

  it('conta as sessões do mês sem as canceladas', () => {
    expect(sessionsThisMonth(list, now)).toBe(3)
  })
})

describe('atividades', () => {
  it('calcula o percentual respondido sem contar canceladas', () => {
    expect(responseRate([])).toBeNull()
    expect(responseRate([
      act({ status: 'submitted' }),
      act({ status: 'reviewed' }),
      act({ status: 'pending' }),
      act({ status: 'expired' }),
      act({ status: 'canceled' }),
    ])).toBe(50)
  })

  it('lista as respostas para revisar da mais antiga para a mais nova', () => {
    const list = awaitingReview([
      act({ id: 'nova', status: 'submitted', respondedAt: '2026-10-09T13:00:00Z' }),
      act({ id: 'revisada', status: 'reviewed' }),
      act({ id: 'antiga', status: 'submitted', respondedAt: '2026-10-08T23:00:00Z' }),
    ])
    expect(list.map(a => a.id)).toEqual(['antiga', 'nova'])
  })
})

describe('relativeTimeLabel', () => {
  it('fala como no protótipo', () => {
    expect(relativeTimeLabel('2026-10-09T17:05:00Z', now)).toBe('há 5 min')
    expect(relativeTimeLabel('2026-10-09T13:00:00Z', now)).toBe('há 4 horas')
    expect(relativeTimeLabel('2026-10-09T00:00:00Z', now)).toBe('ontem, 21h')
    expect(relativeTimeLabel('2026-10-09T00:30:00Z', now)).toBe('ontem, 21h30')
    expect(relativeTimeLabel(null, now)).toBe('')
  })
})
