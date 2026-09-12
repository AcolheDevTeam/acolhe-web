import { describe, expect, it } from 'vitest'
import { signupPayloadSchema, signupSchema, signupTermsVersion } from '~/schemas/signup'

// Campos preenchidos no formulário, sem os que só existem na tela.
const camposDoFormulario = {
  email: 'mariana@example.com',
  password: 'uma-senha-segura',
  fullName: 'Mariana Sá',
  crpNumber: '123456',
  crpState: '06',
  approach: 'TCC',
  acceptTerms: true,
  acceptPrivacy: true,
  termsVersion: signupTermsVersion,
  privacyVersion: signupTermsVersion,
}

// Reproduz pages/signup.vue: confirmPassword é removido antes do $fetch.
function payloadEnviadoPelaPagina(values: Record<string, unknown>) {
  const { confirmPassword: _confirmPassword, ...payload } = values
  return payload
}

describe('contrato do cadastro do psicólogo', () => {
  it('o BFF aceita o payload que a página realmente envia', () => {
    const values = { ...camposDoFormulario, cpf: '', confirmPassword: 'uma-senha-segura' }
    const parsed = signupPayloadSchema.safeParse(payloadEnviadoPelaPagina(values))
    expect(parsed.success).toBe(true)
  })

  it('o BFF não exige confirmPassword, que é campo de tela', () => {
    expect('confirmPassword' in signupPayloadSchema.shape).toBe(false)
  })

  it('aceita cadastro sem CPF, que é opcional no contrato da API', () => {
    expect(signupPayloadSchema.safeParse({ ...camposDoFormulario }).success).toBe(true)
    expect(signupPayloadSchema.safeParse({ ...camposDoFormulario, cpf: '' }).success).toBe(true)
    expect(signupSchema.safeParse({ ...camposDoFormulario, confirmPassword: 'uma-senha-segura' }).success).toBe(true)
  })

  it('rejeita CPF preenchido com formato inválido', () => {
    expect(signupPayloadSchema.safeParse({ ...camposDoFormulario, cpf: '123' }).success).toBe(false)
  })

  it('o formulário exige a confirmação de senha e checa a igualdade', () => {
    expect(signupSchema.safeParse({ ...camposDoFormulario, cpf: '' }).success).toBe(false)
    const divergente = signupSchema.safeParse({ ...camposDoFormulario, cpf: '', confirmPassword: 'outra-senha' })
    expect(divergente.success).toBe(false)
    if (!divergente.success) {
      expect(divergente.error.issues.some((issue) => issue.path[0] === 'confirmPassword')).toBe(true)
    }
  })

  it('normaliza e-mail e região do CRP como a API espera', () => {
    const parsed = signupPayloadSchema.parse({ ...camposDoFormulario, email: 'Mariana@Example.com', crpState: 'CRP-6' })
    expect(parsed.email).toBe('mariana@example.com')
    expect(parsed.crpState).toBe('06')
  })

  it('exige os dois aceites na versão 0.3', () => {
    expect(signupPayloadSchema.safeParse({ ...camposDoFormulario, acceptTerms: false }).success).toBe(false)
    expect(signupPayloadSchema.safeParse({ ...camposDoFormulario, acceptPrivacy: false }).success).toBe(false)
    expect(signupPayloadSchema.safeParse({ ...camposDoFormulario, termsVersion: '0.2' }).success).toBe(false)
  })
})
