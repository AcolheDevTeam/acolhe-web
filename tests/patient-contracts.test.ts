import { describe, expect, it } from 'vitest'
import {
  patientCheckinInputSchema,
  patientContextSchema,
  patientNextSessionSchema,
  patientProcessSummarySchema,
} from '~/schemas/patient'

describe('contratos da área do paciente', () => {
  it('aceita o contexto retornado pelo BFF', () => {
    expect(patientContextSchema.parse({
      patientId: '11111111-1111-4111-8111-111111111111',
      fullName: 'Paciente A',
      relationshipStatus: 'active',
      consented: true,
    }).patientId).toBe('11111111-1111-4111-8111-111111111111')
  })

  it('representa ausência de próxima sessão sem erro', () => {
    expect(patientNextSessionSchema.parse(null)).toBeNull()
  })

  it('valida o resumo e rejeita contagens negativas', () => {
    expect(patientProcessSummarySchema.safeParse({
      sessionCount: 2,
      pendingActivityCount: 1,
      checkinCount: 4,
    }).success).toBe(true)
    expect(patientProcessSummarySchema.safeParse({
      sessionCount: -1,
      pendingActivityCount: 0,
      checkinCount: 0,
    }).success).toBe(false)
  })

  it('não aceita patientId fornecido no check-in', () => {
    expect(patientCheckinInputSchema.safeParse({ mood: 4, patientId: 'other' }).success).toBe(false)
  })
})
