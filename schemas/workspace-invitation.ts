import { z } from 'zod'
import { signupTermsVersion } from '~/schemas/signup'

// Convite para workspace (ACO-62; API: ADR 0002, fase 4). O token do link é a
// credencial; o BFF valida o formato antes de repassar.
export const invitationTokenSchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })

export const invitationPreviewSchema = z.object({
  organizationName: z.string(),
  organizationType: z.string(),
  email: z.string(),
  roles: z.array(z.string()),
  expiresAt: z.string(),
  accountExists: z.boolean(),
  needsCrp: z.boolean(),
})
export type InvitationPreview = z.infer<typeof invitationPreviewSchema>

const crpNumber = z.string().trim().regex(/^\d{4,8}$/, 'Informe apenas os números do CRP.')
const crpState = z.string().trim().transform(value => value.toUpperCase().replace(/^CRP-/, '').padStart(2, '0'))
  .refine(value => /^(0[1-9]|1\d|2[0-4])$/.test(value), 'Informe uma região de CRP válida (01 a 24).')

/** Conta existente: a senha confirma quem aceita; o CRP entra quando o convite
 * inclui atender e a conta ainda não tem perfil de psicóloga. */
export function acceptExistingSchema(needsCrp: boolean) {
  const password = z.string().min(1, 'Informe sua senha.').max(128, 'Senha muito longa.')
  if (!needsCrp) return z.object({ password })
  return z.object({
    password,
    fullName: z.string().trim().min(2, 'Informe seu nome completo.').max(200, 'Nome muito longo.'),
    crpNumber,
    crpState,
  })
}

/** Conta nova: as mesmas regras do cadastro; CRP só quando o convite inclui atender. */
export function acceptNewAccountSchema(needsCrp: boolean) {
  return z.object({
    fullName: z.string().trim().min(2, 'Informe seu nome completo.').max(200, 'Nome muito longo.'),
    password: z.string().min(8, 'Mínimo de 8 caracteres.').max(128, 'Máximo de 128 caracteres.'),
    crpNumber: needsCrp ? crpNumber : z.string().optional(),
    crpState: needsCrp ? crpState : z.string().optional(),
    acceptTerms: z.boolean().refine(value => value, 'Aceite os termos para continuar.'),
    acceptPrivacy: z.boolean().refine(value => value, 'Aceite a Política de Privacidade para continuar.'),
    termsVersion: z.literal(signupTermsVersion),
    privacyVersion: z.literal(signupTermsVersion),
  })
}

/** O que o BFF aceita repassar à API (strict: nada além disso). */
export const acceptPayloadSchema = z.object({
  password: z.string().min(1).max(128),
  fullName: z.string().max(200).optional(),
  crpNumber: z.string().max(16).optional(),
  crpState: z.string().max(8).optional(),
  acceptTerms: z.boolean().optional(),
  acceptPrivacy: z.boolean().optional(),
  termsVersion: z.string().max(8).optional(),
  privacyVersion: z.string().max(8).optional(),
}).strict()
