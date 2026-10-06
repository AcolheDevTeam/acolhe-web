import { z } from 'zod'

// Contrato da verificação de e-mail do cadastro (ACO-61/63).
// Ver acolhe-api/docs/email-verification.md.

// Token opaco do link: 32 bytes em base64url (43 caracteres, sem padding).
// O formato é validado no BFF para nem encaminhar lixo à API; o token nunca
// pode ir para log, analytics ou estado persistido.
export const verifyEmailPayloadSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Link de confirmação inválido.'),
})

export const verifyEmailResponseSchema = z.object({
  emailStatus: z.literal('verified'),
})

export const resendVerificationPayloadSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').transform((value) => value.toLowerCase()),
})

// A API sempre responde 202 com a mesma mensagem, exista a conta ou não.
export const resendVerificationResponseSchema = z.object({
  message: z.string().min(1),
})

export type VerifyEmailPayload = z.infer<typeof verifyEmailPayloadSchema>
export type ResendVerificationPayload = z.infer<typeof resendVerificationPayloadSchema>
