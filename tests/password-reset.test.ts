import { describe, expect, it } from 'vitest'
import { passwordBytes, passwordResetConfirmSchema, passwordResetRequestSchema } from '../schemas/password-reset'

const token = 'A'.repeat(43)

describe('recuperação de senha', () => {
  it('normaliza o e-mail do pedido', () => {
    expect(passwordResetRequestSchema.parse({ email: '  PSI@Acolhe.dev ' })).toEqual({ email: 'psi@acolhe.dev' })
  })

  it('aceita só o formato do token do link', () => {
    expect(passwordResetConfirmSchema.safeParse({ token, password: 'senha-forte' }).success).toBe(true)
    expect(passwordResetConfirmSchema.safeParse({ token: 'curto', password: 'senha-forte' }).success).toBe(false)
  })

  it('aplica o teto de 72 bytes do bcrypt, contando acentos', () => {
    expect(passwordBytes('é')).toBe(2)
    expect(passwordResetConfirmSchema.safeParse({ token, password: 'a'.repeat(72) }).success).toBe(true)
    expect(passwordResetConfirmSchema.safeParse({ token, password: 'a'.repeat(73) }).success).toBe(false)
    expect(passwordResetConfirmSchema.safeParse({ token, password: 'é'.repeat(37) }).success).toBe(false)
    expect(passwordResetConfirmSchema.safeParse({ token, password: 'curta' }).success).toBe(false)
  })
})
