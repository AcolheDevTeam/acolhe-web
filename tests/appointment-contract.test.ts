import { describe, expect, it } from 'vitest'
import { appointmentSchema, createAppointmentSchema, rescheduleAppointmentSchema } from '~/schemas/appointment'
import { updateSessionNotesSchema } from '~/schemas/session'

describe('agendamento e evolução', () => {
  const schedule = { scheduledFor: '2027-01-01T12:00:00Z', durationMinutes: 50, modality: 'online' }
  const patientId = '123e4567-e89b-12d3-a456-426614174000'

  it('agenda um paciente sem enviar evolução ou criar um prontuário', () => {
    expect(createAppointmentSchema.parse({ patientId, ...schedule, notes: 'não enviar' })).toEqual({ patientId, ...schedule })
  })

  it('reagendamento preserva o paciente no servidor e só envia horário, duração e modalidade', () => {
    expect(rescheduleAppointmentSchema.parse({ patientId, ...schedule })).toEqual(schedule)
  })

  it.each([
    { patientId: undefined }, { scheduledFor: '' }, { scheduledFor: '1899-12-31T23:59:59Z' },
    { durationMinutes: 14 }, { durationMinutes: 481 }, { durationMinutes: 50.5 }, { modality: 'telefone' },
  ])('rejeita um agendamento inválido: %j', (change) => {
    expect(createAppointmentSchema.safeParse({ patientId, ...schedule, ...change }).success).toBe(false)
  })

  it('aceita a projeção do agendamento com o prontuário vinculado', () => {
    const value = { id: patientId, patientId, psychologistId: patientId, ...schedule, status: 'confirmed', createdAt: schedule.scheduledFor, patientName: 'Paciente', sessionId: patientId }
    expect(appointmentSchema.parse(value)).toEqual(value)
  })

  it('aceita horários RFC3339 com fuso da API sem exigir mudança no reagendamento', () => {
    const offset = '2027-01-01T09:00:00-03:00'
    expect(rescheduleAppointmentSchema.parse({ ...schedule, scheduledFor: offset }).scheduledFor).toBe(offset)
    expect(appointmentSchema.safeParse({ id: patientId, patientId, psychologistId: patientId,
      ...schedule, scheduledFor: offset, createdAt: offset, status: 'scheduled' }).success).toBe(true)
  })

  it('exige uma versão para editar e permite salvar evolução vazia', () => {
    expect(updateSessionNotesSchema.parse({ version: 1 })).toEqual({ notes: '', version: 1 })
    expect(updateSessionNotesSchema.safeParse({ notes: 'texto' }).success).toBe(false)
    expect(updateSessionNotesSchema.safeParse({ notes: '', version: 0 }).success).toBe(false)
  })

  it('aplica o mesmo limite UTF-8 da API a textos acentuados', () => {
    expect(updateSessionNotesSchema.safeParse({ notes: 'á'.repeat(5000), version: 1 }).success).toBe(true)
    expect(updateSessionNotesSchema.safeParse({ notes: 'á'.repeat(5001), version: 1 }).success).toBe(false)
  })
})
