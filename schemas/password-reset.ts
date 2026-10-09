import { z } from 'zod'
import { newPasswordSchema } from './password'

// Contrato da recuperação de senha (ACO-87).

// Token opaco do link: 32 bytes em base64url (43 caracteres, sem padding), como
// na verificação de e-mail. Nunca vai para log, analytics ou estado persistido.
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Link de redefinição inválido.')

// Regra de senha nova compartilhada com cadastro e convites (ACO-89).
export { PASSWORD_MAX_BYTES, PASSWORD_MIN, passwordBytes } from './password'

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').transform((value) => value.toLowerCase()),
})

export const passwordResetConfirmSchema = z.object({
  token: tokenSchema,
  password: newPasswordSchema,
})

// A API responde 202 com a mesma mensagem, exista a conta ou não.
export const passwordResetRequestResponseSchema = z.object({
  message: z.string().min(1),
})

export const passwordResetSentMessage = 'Se houver uma conta com esse e-mail, a mensagem chega em alguns minutos. Confira também a caixa de spam.'

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>
