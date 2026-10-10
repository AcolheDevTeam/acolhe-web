import { describe, expect, it } from 'vitest'
import { newPasswordSchema } from '../schemas/password'
import { signupPayloadSchema } from '../schemas/signup'

describe('regra única de senha (ACO-89)', () => {
  it('aceita de 8 caracteres a 72 bytes', () => {
    expect(newPasswordSchema.safeParse('12345678').success).toBe(true)
    expect(newPasswordSchema.safeParse('a'.repeat(72)).success).toBe(true)
  })

  it('recusa curta e acima do teto do bcrypt, contando acentos em bytes', () => {
    expect(newPasswordSchema.safeParse('1234567').success).toBe(false)
    expect(newPasswordSchema.safeParse('a'.repeat(73)).success).toBe(false)
    expect(newPasswordSchema.safeParse('é'.repeat(37)).success).toBe(false)
    expect(newPasswordSchema.safeParse('é'.repeat(8)).success).toBe(true)
  })

  it('o cadastro usa a mesma regra', () => {
    const shape = signupPayloadSchema.shape.password
    expect(shape.safeParse('a'.repeat(100)).success).toBe(false)
  })
})
