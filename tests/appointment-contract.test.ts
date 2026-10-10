import { describe, expect, it } from 'vitest'
import { appointmentSchema, createAppointmentSchema, rescheduleAppointmentSchema } from '~/schemas/appointment'
import { updateSessionRecordSchema } from '~/schemas/session'

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

  it('exige uma versão para editar e permite salvar o prontuário vazio', () => {
    expect(updateSessionRecordSchema.parse({ version: 1 }))
      .toEqual({ demand: '', evolution: '', conduct: '', referral: '', version: 1 })
    expect(updateSessionRecordSchema.safeParse({ evolution: 'texto' }).success).toBe(false)
    expect(updateSessionRecordSchema.safeParse({ version: 0 }).success).toBe(false)
  })

  it('não apara o texto e limita cada seção a 10.000 caracteres, como a API', () => {
    expect(updateSessionRecordSchema.parse({ demand: '  linha\n  recuada ', version: 1 }).demand).toBe('  linha\n  recuada ')
    expect(updateSessionRecordSchema.safeParse({ evolution: 'á'.repeat(10000), version: 1 }).success).toBe(true)
    const tooLong = updateSessionRecordSchema.safeParse({ evolution: 'á'.repeat(10001), version: 1 })
    expect(tooLong.success).toBe(false)
    expect(tooLong.error?.issues[0]?.message).toBe('Evolução desta sessão: no máximo 10.000 caracteres.')
    // Emoji conta como um caractere, como na API (não como dois do UTF-16).
    expect(updateSessionRecordSchema.safeParse({ conduct: '🙂'.repeat(10000), version: 1 }).success).toBe(true)
  })
})
