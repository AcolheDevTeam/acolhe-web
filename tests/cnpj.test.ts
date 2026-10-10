import { describe, expect, it } from 'vitest'
import { isValidCnpj, normalizeCnpj } from '~/utils/cnpj'
import { clinicSignupPayloadSchema, createClinicPayloadSchema } from '~/schemas/clinic-signup'

describe('CNPJ numérico e alfanumérico', () => {
  it('valida exemplos oficiais nos dois formatos e normaliza em maiúsculas', () => {
    expect(isValidCnpj('00.000.000/0001-91')).toBe(true)
    expect(isValidCnpj('00.000.000/E08G-12')).toBe(true)
    expect(isValidCnpj('12.ABC.345/01DE-35')).toBe(true)
    expect(normalizeCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35')
  })

  it('rejeita formato incompleto, repetição e dígitos verificadores inválidos', () => {
    expect(isValidCnpj('12.ABC.345/01DE-34')).toBe(false)
    expect(isValidCnpj('11111111111111')).toBe(false)
    expect(isValidCnpj('12.ABC.345/01D-35')).toBe(false)
  })

  it('exige CNPJ e CRP somente quando a responsável também atende', () => {
    const base = { fullName: 'Ana Clínica', email: 'ana@example.com', password: 'SenhaForte123!', clinicName: 'Clínica Travessia', cnpj: '12.abc.345/01de-35', ownerAttends: false, acceptTerms: true, acceptPrivacy: true, termsVersion: '0.3', privacyVersion: '0.3' }
    expect(clinicSignupPayloadSchema.safeParse(base).success).toBe(true)
    expect(clinicSignupPayloadSchema.safeParse({ ...base, ownerAttends: true }).success).toBe(false)
    expect(clinicSignupPayloadSchema.safeParse({ ...base, ownerAttends: true, crpNumber: '123456', crpState: '05' }).success).toBe(true)
    expect(createClinicPayloadSchema.safeParse({ name: 'Clínica Travessia', cnpj: '12.abc.345/01de-35', ownerAttends: false }).success).toBe(true)
  })
})
