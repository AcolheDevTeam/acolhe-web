import { describe, expect, it } from 'vitest'
import { createSessionSchema } from '~/schemas/session'

describe('contrato de criação de sessão', () => {
  const payload = {
    patientId: '123e4567-e89b-12d3-a456-426614174000',
    notes: 'Registro da sessão',
  }

  it.each([-365, -1, 0])('aceita uma sessão a %i dias de hoje', (days) => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() + days)
    expect(createSessionSchema.safeParse({ ...payload, occurredAt: date.toISOString() }).success).toBe(true)
  })

  it.each([1, 365])('rejeita registro clínico a %i dias no futuro e orienta agendar', (days) => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() + days)
    const result = createSessionSchema.safeParse({ ...payload, occurredAt: date.toISOString() })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues.some(issue => issue.message === 'Para uma sessão futura, crie um agendamento')).toBe(true)
  })

  it.each(['', 'data inválida', '1899-12-31T23:59:59Z'])('rejeita data inválida: %s', (occurredAt) => {
    expect(createSessionSchema.safeParse({ ...payload, occurredAt }).success).toBe(false)
  })

  it.each([undefined, '', '  '])('aceita evolução ausente ou vazia: %s', (notes) => {
    const result = createSessionSchema.parse({ ...payload, occurredAt: '2020-01-01T12:00:00Z', notes })
    expect(result.notes).toBe('')
  })

  it('mantém o limite de tamanho da evolução', () => {
    expect(createSessionSchema.safeParse({
      ...payload, occurredAt: '2020-01-01T12:00:00Z', notes: 'a'.repeat(10001),
    }).success).toBe(false)
  })
})
