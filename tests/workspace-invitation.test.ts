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
