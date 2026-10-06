import { describe, expect, it } from 'vitest'
import {
  resendVerificationPayloadSchema,
  verifyEmailPayloadSchema,
  verifyEmailResponseSchema,
} from '~/schemas/verify-email'
import { verifyEmailConfirmed, verifyEmailFeedback } from '~/utils/verify-email'
import { authRedirect } from '~/utils/patient-portal'

// Token real: 32 bytes em base64url = 43 caracteres sem padding.
const tokenValido = 'A'.repeat(43)

describe('contrato da confirmação de e-mail', () => {
  it('aceita o token no formato do link e rejeita qualquer outra coisa', () => {
    expect(verifyEmailPayloadSchema.safeParse({ token: tokenValido }).success).toBe(true)
    for (const token of ['', 'curto', `${tokenValido}=`, 'token com espaço', 'A'.repeat(44)]) {
      expect(verifyEmailPayloadSchema.safeParse({ token }).success).toBe(false)
    }
  })

  it('a resposta de sucesso é sempre emailStatus verified', () => {
    expect(verifyEmailResponseSchema.safeParse({ emailStatus: 'verified' }).success).toBe(true)
    expect(verifyEmailResponseSchema.safeParse({ emailStatus: 'pending' }).success).toBe(false)
  })

  it('o reenvio normaliza o e-mail como a API espera', () => {
    const parsed = resendVerificationPayloadSchema.safeParse({ email: '  PSI@Example.COM ' })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.email).toBe('psi@example.com')
  })
})

describe('estados da tela de confirmação (regra A6)', () => {
  it('cada status da API vira orientação própria, nunca a mesma frase', () => {
    const invalido = verifyEmailFeedback(404)
    const vencido = verifyEmailFeedback(410)
    const indisponivel = verifyEmailFeedback(503)
    expect(invalido.state).toBe('invalid')
    expect(vencido.state).toBe('expired')
    expect(indisponivel.state).toBe('unavailable')
    const mensagens = [invalido.message, vencido.message, indisponivel.message]
    expect(new Set(mensagens).size).toBe(mensagens.length)
  })

  it('link vencido ou substituído oferece reenvio; falha nossa oferece retry', () => {
    expect(verifyEmailFeedback(404).canResend).toBe(true)
    expect(verifyEmailFeedback(410).canResend).toBe(true)
    expect(verifyEmailFeedback(503).canResend).toBe(false)
    expect(verifyEmailFeedback(503).canRetry).toBe(true)
    expect(verifyEmailFeedback(undefined).canRetry).toBe(true)
  })

  it('falha nossa não afirma causa que a API não disse (lição do C8)', () => {
    const indisponivel = verifyEmailFeedback(500)
    for (const palavra of ['vencido', 'venceu', 'expirado', 'utilizado', 'usado', 'inválido']) {
      expect(indisponivel.message.toLowerCase()).not.toContain(palavra)
    }
  })

  it('confirmado orienta o próximo passo, sem reenvio nem retry', () => {
    expect(verifyEmailConfirmed.state).toBe('confirmed')
    expect(verifyEmailConfirmed.canResend).toBe(false)
    expect(verifyEmailConfirmed.canRetry).toBe(false)
  })
})

describe('gate de navegação por e-mail pendente', () => {
  it('conta pendente é levada para /verify-email; verificada segue normal', () => {
    expect(authRedirect({ role: 'psychologist', nextStep: 'verify_email' })).toBe('/verify-email')
    expect(authRedirect({ role: 'psychologist' })).toBeUndefined()
    expect(authRedirect(null)).toBe('/login')
  })

  it('contas antigas sem o campo não são travadas', () => {
    expect(authRedirect({ role: 'patient' })).toBeUndefined()
  })
})
