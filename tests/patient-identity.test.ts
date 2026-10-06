import { describe, expect, it } from 'vitest'
import { createPatientSchema, patientSchema } from '~/schemas/patient'
import { patientRelationshipLabel } from '~/utils/patient-identity'

const patient = {
  id: '11111111-1111-4111-8111-111111111111', fullName: 'Paciente',
  status: 'active', relationshipStatus: 'active', createdAt: '2026-10-01T12:00:00Z',
}

describe('identificação do paciente', () => {
  it('preserva contato e evidência de consentimento no contrato do BFF', () => {
    const detail = { ...patient, email: 'paciente@example.test', phone: '+55 (11) 99999-9999',
      healthConsent: { accepted: true, version: '2026-01', decidedAt: '2026-10-01T12:00:00Z' } }
    expect(patientSchema.parse(detail)).toEqual(detail)
  })
  it('não inventa consentimento para um vínculo ativo legado', () => {
    expect(patientSchema.parse(patient).healthConsent).toBeUndefined()
  })
  it('aceita campos ausentes ou nulos e rejeita evidência incompleta', () => {
    expect(patientSchema.safeParse({ ...patient, email: null, phone: null, healthConsent: null }).success).toBe(true)
    expect(patientSchema.safeParse({ ...patient, healthConsent: { accepted: true } }).success).toBe(false)
  })
  it.each(['', '11999999999', '+55 (11) 99999-9999'])('aceita telefone opcional: %s', (phone) => {
    expect(createPatientSchema.safeParse({ fullName: 'Paciente', email: 'a@example.test', phone }).success).toBe(true)
  })
  it.each(['abc', '123', '1234567890123456', '11<script>999999999'])('rejeita telefone inválido: %s', (phone) => {
    expect(createPatientSchema.safeParse({ fullName: 'Paciente', email: 'a@example.test', phone }).success).toBe(false)
  })
  it('traduz o vínculo real, incluindo pendente e pausado', () => {
    expect(patientRelationshipLabel('active')).toBe('Ativo')
    expect(patientRelationshipLabel('pending')).toBe('Aguardando aceite')
    expect(patientRelationshipLabel('paused')).toBe('Pausado')
    expect(patientRelationshipLabel(undefined)).toBe('Não informado')
  })
})
