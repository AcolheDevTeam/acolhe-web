import { describe, expect, it } from 'vitest'
import type { AppNotification } from '~/schemas/notification'
import { notificationPageSchema, notificationPreferenceBodySchema, notificationPreferencesSchema } from '~/schemas/notification'
import {
  badgeCount,
  bellLabel,
  groupNotificationsByDay,
  notificationDayTitle,
  notificationErrorMessage,
  notificationKindMeta,
  notificationLink,
  notificationTime,
  notificationWho,
  preferenceRows,
  unreadKey,
  unreadSummary,
  withPreference,
} from '~/utils/notifications'

const base: AppNotification = {
  id: '11111111-1111-4111-8111-111111111111',
  kind: 'activity_submitted',
  patientId: '22222222-2222-4222-8222-222222222222',
  patientName: 'Júlia Andrade',
  activityAssignmentId: '33333333-3333-4333-8333-333333333333',
  appointmentId: null,
  createdAt: '2026-10-10T13:04:00Z',
  readAt: null,
}

describe('caixa de notificações (ACO-99)', () => {
  it('aceita a página da API e recusa tipo desconhecido', () => {
    const page = notificationPageSchema.parse({ items: [base], nextCursor: null })
    expect(page.items[0]?.kind).toBe('activity_submitted')
    expect(() => notificationPageSchema.parse({ items: [{ ...base, kind: 'pagamento' }], nextCursor: null })).toThrow()
  })

  it('leva cada tipo ao recurso certo', () => {
    expect(notificationLink(base)).toBe('/activities/33333333-3333-4333-8333-333333333333')
    expect(notificationLink({ ...base, kind: 'appointment_confirmed', activityAssignmentId: null, appointmentId: '44444444-4444-4444-8444-444444444444' }))
      .toBe('/appointments/44444444-4444-4444-8444-444444444444')
    expect(notificationLink({ ...base, kind: 'invitation_accepted', activityAssignmentId: null }))
      .toBe('/patients/22222222-2222-4222-8222-222222222222')
  })

  it('monta a frase só com nome e tipo, sem conteúdo', () => {
    expect(notificationWho(base)).toBe('Júlia Andrade')
    expect(notificationWho({ patientName: null })).toBe('Paciente')
    expect(notificationKindMeta.appointment_confirmed.action).toBe('confirmou presença na sessão.')
  })

  it('agrupa por dia no fuso de São Paulo', () => {
    const now = '2026-10-10T15:00:00Z'
    const items = [
      base,
      { ...base, id: 'b', createdAt: '2026-10-10T02:30:00Z' }, // 9/10, 23h30 em São Paulo
      { ...base, id: 'c', createdAt: '2026-10-05T12:00:00Z' },
    ]
    const groups = groupNotificationsByDay(items, now)
    expect(groups.map(g => g.title)).toEqual(['Hoje', 'Ontem', 'Segunda-feira, 5 de outubro'])
    expect(groups[0]?.items).toHaveLength(1)
    expect(notificationDayTitle('2026-10-10', now)).toBe('Hoje')
  })

  it('formata hora, resumo e contador', () => {
    expect(notificationTime('2026-10-10T13:04:00Z')).toBe('10h04')
    expect(unreadSummary(0)).toBe('Tudo lido.')
    expect(unreadSummary(1)).toBe('1 não lida.')
    expect(unreadSummary(3)).toBe('3 não lidas.')
    expect(bellLabel(2)).toBe('Notificações, 2 não lidas')
    expect(badgeCount(120)).toBe('99+')
    expect(unreadKey('org-1')).not.toBe(unreadKey('org-2'))
  })

  it('erros diferentes viram mensagens diferentes', () => {
    const notFound = notificationErrorMessage({ statusCode: 404 }, 'read')
    const failure = notificationErrorMessage({ statusCode: 500 }, 'read')
    const save = notificationErrorMessage({ statusCode: 500 }, 'save-preference')
    expect(notFound).toContain('não existe mais')
    expect(failure).not.toBe(notFound)
    expect(save).toContain('voltou ao que estava')
    expect(notificationErrorMessage({ statusCode: 402 }, 'read-all')).toContain('Assinatura inativa')
  })
})

describe('preferências de notificação', () => {
  it('completa a matriz com o padrão: no app ligado, e-mail desligado', () => {
    const rows = preferenceRows([{ kind: 'appointment_confirmed', inApp: false, email: true }])
    expect(rows.map(r => r.kind)).toEqual(['activity_submitted', 'appointment_confirmed', 'invitation_accepted'])
    expect(rows[0]).toEqual({ kind: 'activity_submitted', inApp: true, email: false })
    expect(rows[1]).toEqual({ kind: 'appointment_confirmed', inApp: false, email: true })
  })

  it('troca um canal sem mexer no resto', () => {
    const rows = preferenceRows([])
    const next = withPreference(rows, 'invitation_accepted', 'email', true)
    expect(next[2]).toEqual({ kind: 'invitation_accepted', inApp: true, email: true })
    expect(next[0]).toEqual(rows[0])
  })

  it('valida o corpo e a resposta', () => {
    expect(() => notificationPreferenceBodySchema.parse({ inApp: true })).toThrow()
    expect(notificationPreferencesSchema.parse({ preferences: [] }).preferences).toEqual([])
  })
})
