import { describe, expect, it } from 'vitest'
import { consentScopeParamSchema, patientProfileUpdateSchema, patientSelfExportSchema, patientSettingsSchema } from '../schemas/patient-settings'
import type { PatientSettingsConsent } from '../schemas/patient-settings'
import {
  consentErrorMessage,
  consentStatusLabel,
  healthRevokedNotice,
  profileErrorMessage,
  psychologistMeta,
  selfExportErrorMessage,
  selfExportNotice,
} from '../utils/patient-settings'

const consent = (over: Partial<PatientSettingsConsent> = {}): PatientSettingsConsent => ({
  scope: 'health_data',
  documentId: '7a1d2c3e-1111-4222-8333-944455556666',
  title: 'Dados de saúde',
  content: 'Texto',
  version: '0.3',
  required: true,
  status: 'accepted',
  acceptedAt: '2025-10-12T15:00:00Z',
  acceptedVersion: '0.3',
  revokedAt: null,
  ...over,
})

const settings = {
  profile: { fullName: 'Júlia Andrade', email: 'julia@exemplo.com', phone: null },
  psychologist: { name: 'Mariana Sá', crp: '06/123456', since: '2025-10-12T15:00:00Z', relationshipStatus: 'active' },
  consents: [consent()],
  export: null,
}

describe('contrato dos Ajustes da paciente (ACO-102)', () => {
  it('aceita a resposta da API', () => {
    expect(patientSettingsSchema.parse(settings).profile.fullName).toBe('Júlia Andrade')
  })

  it('só aceita os escopos da paciente na rota', () => {
    expect(consentScopeParamSchema.safeParse({ scope: 'communications' }).success).toBe(true)
    expect(consentScopeParamSchema.safeParse({ scope: 'terms_of_use' }).success).toBe(false)
    expect(consentScopeParamSchema.safeParse({ scope: '../patients' }).success).toBe(false)
  })

  it('valida nome e telefone em português; telefone vazio apaga, ausente mantém', () => {
    expect(patientProfileUpdateSchema.safeParse({ fullName: ' ', phone: '' }).error?.issues[0]?.message).toBe('Informe seu nome completo.')
    expect(patientProfileUpdateSchema.safeParse({ fullName: 'Júlia', phone: '123' }).error?.issues[0]?.message).toBe('Informe um telefone válido, com DDD.')
    expect(patientProfileUpdateSchema.parse({ fullName: 'Júlia', phone: '' }).phone).toBe('')
    expect(patientProfileUpdateSchema.parse({ fullName: 'Júlia' }).phone).toBeUndefined()
  })

  it('não repassa patientId vindo do cliente', () => {
    const parsed = patientProfileUpdateSchema.parse({ fullName: 'Júlia', phone: '', patientId: 'outra' })
    expect(parsed).not.toHaveProperty('patientId')
  })
})

describe('textos dos Ajustes', () => {
  it('estado de cada consentimento', () => {
    expect(consentStatusLabel(consent())).toBe('Autorizado em 12/10/2025')
    expect(consentStatusLabel(consent({ status: 'revoked', revokedAt: '2026-10-09T13:00:00Z' }))).toBe('Revogado em 09/10/2026')
    expect(consentStatusLabel(consent({ status: 'not_given', acceptedAt: null }))).toBe('Não autorizado')
  })

  it('psicóloga com CRP, desde quando e o estado do vínculo', () => {
    expect(psychologistMeta({ name: 'Mariana', crp: '06/123456', since: '2025-10-12T15:00:00Z', relationshipStatus: 'active' })).toBe('CRP 06/123456 · desde out/2025')
    expect(psychologistMeta({ name: 'Mariana', crp: '06/123456', since: null, relationshipStatus: 'paused' })).toBe('CRP 06/123456 · Acompanhamento pelo app pausado')
  })

  it('aviso da revogação do consentimento de saúde, sem promessas além do que acontece', () => {
    expect(healthRevokedNotice(patientSettingsSchema.parse(settings))).toBeNull()
    const revoked = patientSettingsSchema.parse({ ...settings, consents: [consent({ status: 'revoked', revokedAt: '2026-10-09T13:00:00Z' })] })
    expect(healthRevokedNotice(revoked)).toBe('Consentimento de dados de saúde revogado em 09/10/2026. O acompanhamento pelo app está pausado. Seus registros continuam guardados pelo prazo previsto em lei.')
  })

  it('situação do pedido dos próprios dados', () => {
    const next = new Date(Date.now() + 3600_000).toISOString()
    const base = { requestedAt: '2026-10-10T12:00:00Z', nextAvailableAt: next }
    expect(selfExportNotice(null)).toBeNull()
    expect(selfExportNotice(patientSelfExportSchema.parse({ ...base, status: 'in_progress' }))).toBe('Pedido feito. O link chega por e-mail em até 24 horas.')
    expect(selfExportNotice(patientSelfExportSchema.parse({ ...base, status: 'in_progress', alreadyRequested: true }))).toMatch(/^Você já pediu seus dados em 10\/10\/2026 às 09:00\./)
    expect(selfExportNotice(patientSelfExportSchema.parse({ ...base, status: 'sent' }))).toMatch(/Enviamos o link para o seu e-mail/)
    expect(selfExportNotice(patientSelfExportSchema.parse({ ...base, nextAvailableAt: null, status: 'failed' }))).toMatch(/Peça de novo/)
    expect(selfExportNotice(patientSelfExportSchema.parse({ ...base, nextAvailableAt: null, status: 'sent' }))).toBeNull()
  })

  it('erros diferentes, mensagens diferentes (A6)', () => {
    const err = (statusCode: number, data?: object) => ({ statusCode, data })
    expect(consentErrorMessage(err(409), 'revoke')).toMatch(/já estava revogado/)
    expect(consentErrorMessage(err(409), 'accept')).toMatch(/já estava autorizado/)
    expect(consentErrorMessage(err(404), 'revoke')).toMatch(/não está mais disponível/)
    expect(selfExportErrorMessage(err(503))).toMatch(/indisponível agora/)
    expect(profileErrorMessage(err(400, { data: { field: 'phone' } }))).toMatch(/telefone válido/)
    expect(profileErrorMessage(err(400, { data: { message: 'telefone inválido: use de 8 a 15 dígitos, com DDD' } }))).toMatch(/telefone válido/)
    expect(profileErrorMessage(err(400, { data: { message: 'informe o nome completo, com 2 a 200 caracteres' } }))).toMatch(/nome completo/)
    expect(profileErrorMessage(err(503))).toMatch(/guardar o telefone/)
  })
})
