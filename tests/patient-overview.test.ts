import { describe, expect, it } from 'vitest'
import type { Activity, Patient, PatientCheckin } from '~/types'
import {
  activityResponse,
  maskPhone,
  moodSummary,
  patientLinkActive,
  relationshipBadge,
  sessionWhenLabel,
  timelineWhenLabel,
} from '~/utils/patient-overview'

const now = new Date('2026-10-09T15:00:00Z') // 12h em São Paulo

const checkin = (day: string, mood: number): PatientCheckin => ({
  id: day, day, mood, updatedAt: `${day}T12:00:00Z`, createdAt: `${day}T12:00:00Z`,
})

const activity = (status: string): Activity => ({ id: status + Math.random(), patientId: 'p', title: 'A', type: 'text', status })

const patient = (over: Partial<Patient>): Patient => ({
  id: 'p', fullName: 'Paciente', status: 'active', relationshipStatus: 'active', createdAt: '2026-01-01T00:00:00Z', ...over,
})

describe('visão geral da ficha', () => {
  it('só libera dado clínico com cadastro e vínculo ativos', () => {
    expect(patientLinkActive(patient({}))).toBe(true)
    expect(patientLinkActive(patient({ status: 'onboarding', relationshipStatus: 'pending' }))).toBe(false)
    expect(patientLinkActive(patient({ relationshipStatus: 'paused' }))).toBe(false)
    expect(patientLinkActive(null)).toBe(false)
  })

  it('calcula o humor só com os check-ins dos últimos 30 dias, em ordem', () => {
    const summary = moodSummary([
      checkin('2026-10-09', 5), checkin('2026-09-10', 3), checkin('2026-09-09', 1), checkin('2026-10-01', 4),
    ], now)
    expect(summary.series).toEqual([3, 4, 5])
    expect(summary.avgLabel).toBe('4,0')
    expect(moodSummary([], now)).toEqual({ series: [], count: 0, avgLabel: null })
  })

  it('conta respondidas (enviadas ou revisadas) e ignora canceladas', () => {
    const result = activityResponse(['submitted', 'reviewed', 'pending', 'expired', 'canceled'].map(activity))
    expect(result).toEqual({ responded: 2, total: 4, pct: 50 })
    expect(activityResponse([]).pct).toBeNull()
  })

  it('mostra a duração do vínculo a partir do aceite do consentimento', () => {
    expect(relationshipBadge(patient({ healthConsent: { accepted: true, version: 'v1', decidedAt: '2026-03-01T12:00:00Z' } }), now))
      .toEqual({ label: 'Vínculo ativo · 7 meses', variant: 'positive' })
    expect(relationshipBadge(patient({}), now).label).toBe('Vínculo ativo')
    expect(relationshipBadge(patient({ relationshipStatus: 'pending' }), now))
      .toEqual({ label: 'Aguardando aceite', variant: 'warning' })
  })

  it('mascara o miolo do telefone mantendo DDD e os dois últimos dígitos', () => {
    expect(maskPhone('(11) 99999-9942')).toBe('(11) 9••••-••42')
    expect(maskPhone('+55 (11) 99999-9942')).toBe('+55 (11) 9••••-••42')
    expect(maskPhone('123')).toBe('123')
  })

  it('formata a próxima sessão e os eventos da linha do tempo no fuso do app', () => {
    expect(sessionWhenLabel('2026-10-09T17:00:00Z', now)).toBe('Hoje, 14h00')
    expect(sessionWhenLabel('2026-10-10T12:30:00Z', now)).toBe('Amanhã, 9h30')
    expect(sessionWhenLabel('2026-10-16T17:00:00Z', now)).toBe('16 out, 14h00')
    expect(timelineWhenLabel('2026-10-09T13:00:00Z', now)).toBe('hoje 10h00')
    expect(timelineWhenLabel('2026-10-08T13:00:00Z', now)).toBe('ontem')
    expect(timelineWhenLabel('2026-10-02T13:00:00Z', now)).toBe('2 out')
  })
})
