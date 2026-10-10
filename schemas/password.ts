import { z } from 'zod'

// Regra única de senha nova (ACO-89), igual à da API: pelo menos 8 caracteres
// e no máximo 72 bytes — o teto do bcrypt. Letras acentuadas ocupam 2 bytes.
export const PASSWORD_MIN = 8
export const PASSWORD_MAX_BYTES = 72

export function passwordBytes(value: string): number {
  return new TextEncoder().encode(value).length
}

export const passwordTooLongMessage = 'A senha está longa demais. Use até 72 caracteres sem acento.'

export const newPasswordSchema = z.string()
  .min(PASSWORD_MIN, `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`)
  .refine(value => passwordBytes(value) <= PASSWORD_MAX_BYTES, passwordTooLongMessage)
