import { describe, expect, it } from 'vitest'
import { pendingRecordAppointments } from '../utils/patient-record'
import type { Appointment, Session } from '../types'
const now = Date.parse('2026-10-02T15:00:00Z')
const appointment = (id: string, overrides: Partial<Appointment> = {}): Appointment => ({
  id, patientId: 'patient-a', psychologistId: 'psy', scheduledFor: '2026-10-01T15:00:00Z',
  createdAt: '2026-09-01T15:00:00Z', durationMinutes: 50, modality: 'online', status: 'confirmed', ...overrides,
})
describe('agendamentos acessíveis pelo prontuário', () => {
  it('inclui passados elegíveis, sem incluir futuros, faltas, cancelados ou outra paciente', () => {
    const rows = [appointment('past'), appointment('completed', { status: 'completed' }), appointment('scheduled', { status: 'scheduled' }),
      appointment('future', { scheduledFor: '2026-10-03T15:00:00Z' }), appointment('canceled', { status: 'canceled' }),
      appointment('absent', { status: 'no_show' }), appointment('other', { patientId: 'patient-b' })]
    expect(pendingRecordAppointments(rows, [], 'patient-a', now).map(a => a.id)).toEqual(['past', 'completed', 'scheduled'])
  })
  it('não classifica como sem sessão um agendamento vinculado, mesmo com a lista de sessões desatualizada', () => {
    const sessions = [{ id: 'session-a' }, { id: 'session-b', appointmentId: 'linked' }] as Session[]
    const rows = [appointment('existing', { sessionId: 'session-a' }), appointment('linked'), appointment('new', { sessionId: 'session-new' })]
    expect(pendingRecordAppointments(rows, sessions, 'patient-a', now).map(a => a.id)).toEqual([])
  })
  it('ordena pelos horários mais recentes e inclui o horário atual', () => {
    const rows = [appointment('old'), appointment('now', { scheduledFor: new Date(now).toISOString() })]
    expect(pendingRecordAppointments(rows, [], 'patient-a', now).map(a => a.id)).toEqual(['now', 'old'])
  })
})
