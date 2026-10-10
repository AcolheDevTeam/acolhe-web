import { describe, expect, it } from 'vitest'
import { acceptNewAccountSchema, acceptPayloadSchema, invitationTokenSchema } from '../schemas/workspace-invitation'
import { invitationErrorMessage } from '../utils/workspace-invitation'

const conflict = (message: string) => ({ statusCode: 409, data: { message } })

describe('convite para workspace (ACO-62)', () => {
  it('aceita só tokens no formato do link', () => {
    expect(invitationTokenSchema.safeParse({ token: 'A'.repeat(43) }).success).toBe(true)
    expect(invitationTokenSchema.safeParse({ token: '../../etc' }).success).toBe(false)
  })
  it('CRP só é exigido quando o convite inclui atender', () => {
    const base = { fullName: 'Ana Souza', password: 'senha-segura', acceptTerms: true, acceptPrivacy: true, termsVersion: '0.3', privacyVersion: '0.3' }
    expect(acceptNewAccountSchema(false).safeParse(base).success).toBe(true)
    expect(acceptNewAccountSchema(true).safeParse(base).success).toBe(false)
    expect(acceptNewAccountSchema(true).safeParse({ ...base, crpNumber: '123456', crpState: '6' }).success).toBe(true)
  })
  it('o BFF não repassa campos fora do contrato', () => {
    expect(acceptPayloadSchema.safeParse({ password: 'x', role: 'admin' }).success).toBe(false)
  })
  it('cada 409 tem o seu texto', () => {
    expect(invitationErrorMessage(conflict('este e-mail já é usado por uma conta de paciente'))).toContain('conta de paciente')
    expect(invitationErrorMessage(conflict('você já faz parte deste espaço de trabalho'))).toContain('já faz parte')
    expect(invitationErrorMessage(conflict('este CRP já está cadastrado em outra conta'))).toContain('CRP')
    expect(invitationErrorMessage({ statusCode: 410 })).toContain('expirou')
    expect(invitationErrorMessage({ statusCode: 401 })).toBe('Senha incorreta.')
  })
})

describe('conta existente que passa a atender (ACO-62)', async () => {
  const { acceptExistingSchema } = await import('../schemas/workspace-invitation')
  const { invitationErrorMessage } = await import('../utils/workspace-invitation')
  it('pede CRP só quando o convite inclui atender e falta o perfil', () => {
    expect(acceptExistingSchema(false).safeParse({ password: 'x' }).success).toBe(true)
    expect(acceptExistingSchema(true).safeParse({ password: 'x' }).success).toBe(false)
    expect(acceptExistingSchema(true).safeParse({ password: 'x', fullName: 'Ana Souza', crpNumber: '123456', crpState: '06' }).success).toBe(true)
  })
  it('link cortado na prévia não fala de formulário', () => {
    expect(invitationErrorMessage({ statusCode: 400 }, 'preview')).toContain('link está completo')
  })
})

describe('mensagens da área da clínica (ACO-62)', async () => {
  const { clinicErrorMessage, deliveryMessage } = await import('../utils/clinic')
  const err = (statusCode: number, message: string) => ({ statusCode, data: { message } })
  it('cada recusa diz o motivo', () => {
    expect(clinicErrorMessage(err(403, 'só a responsável pela clínica pode fazer isto'))).toContain('Só o(a) responsável')
    expect(clinicErrorMessage(err(403, 'você não pode alterar o seu próprio vínculo'))).toContain('próprio vínculo')
    expect(clinicErrorMessage(err(409, 'a clínica precisa de ao menos uma responsável ativa; fale com o suporte'))).toContain('responsável ativo(a)')
    expect(clinicErrorMessage(err(409, 'já existe um convite pendente para este e-mail'))).toContain('convite pendente')
  })
  it('o link copiável aparece em qualquer resultado do e-mail', () => {
    expect(deliveryMessage('failed')).toContain('link')
    expect(deliveryMessage('disabled')).toContain('link')
  })
})
