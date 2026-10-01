import { describe, expect, it } from 'vitest'
import { checkinDay, checkinDateLabel } from '~/utils/checkin'
import { patientCheckinInputSchema, patientCheckinSchema } from '~/schemas/patient'

describe('check-in diário', () => {
  it('considera meia-noite em Fortaleza, sem depender do fuso do navegador', () => {
    expect(checkinDay('2026-10-01T02:59:59Z')).toBe('2026-09-30')
    expect(checkinDay('2026-10-01T03:00:00Z')).toBe('2026-10-01')
    expect(checkinDay('2026-10-01T00:00:00-03:00')).toBe('2026-10-01')
  })

  it('exibe a data do registro sem deslocar para o dia anterior', () => {
    expect(checkinDateLabel('2026-10-01')).toBe('1 de outubro de 2026')
  })

  it('aceita o registro consultado por paciente e psicóloga', () => {
    expect(patientCheckinSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000', mood: 4, note: null,
      day: '2026-10-01', createdAt: '2026-10-01T09:00:00-03:00', updatedAt: '2026-10-01T10:00:00-03:00',
    }).day).toBe('2026-10-01')
  })

  it('aplica a mesma validação à criação e à edição, com observação opcional', () => {
    expect(patientCheckinInputSchema.parse({ mood: 3, note: '  Estou bem  ' })).toEqual({ mood: 3, note: 'Estou bem' })
    expect(patientCheckinInputSchema.parse({ mood: 5, note: '' }).note).toBe('')
    expect(patientCheckinInputSchema.safeParse({ mood: 3, note: 'a'.repeat(1001) }).success).toBe(false)
    expect(patientCheckinInputSchema.safeParse({ mood: 6 }).success).toBe(false)
    expect(patientCheckinInputSchema.safeParse({ mood: 3, patientId: 'outro' }).success).toBe(false)
  })
})
