import { z } from 'zod'

// Contrato da recuperação de senha (ACO-87).

// Token opaco do link: 32 bytes em base64url (43 caracteres, sem padding), como
// na verificação de e-mail. Nunca vai para log, analytics ou estado persistido.
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Link de redefinição inválido.')

// Regra da API: pelo menos 8 caracteres e no máximo 72 bytes (teto do bcrypt;
// letras acentuadas ocupam 2 bytes).
export const PASSWORD_MIN = 8
export const PASSWORD_MAX_BYTES = 72

export function passwordBytes(value: string): number {
  return new TextEncoder().encode(value).length
}

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').transform((value) => value.toLowerCase()),
})

export const passwordResetConfirmSchema = z.object({
  token: tokenSchema,
  password: z.string()
    .min(PASSWORD_MIN, `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`)
    .refine(value => passwordBytes(value) <= PASSWORD_MAX_BYTES, 'A senha está longa demais. Use até 72 caracteres sem acento.'),
})

// A API responde 202 com a mesma mensagem, exista a conta ou não.
export const passwordResetRequestResponseSchema = z.object({
  message: z.string().min(1),
})

export const passwordResetSentMessage = 'Se houver uma conta com esse e-mail, a mensagem chega em alguns minutos. Confira também a caixa de spam.'

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>
