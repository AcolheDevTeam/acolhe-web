import { z } from 'zod'
import { newPasswordSchema } from './password'
import { signupTermsVersion } from './signup'
import { isValidCnpj, normalizeCnpj } from '~/utils/cnpj'

const emailSchema = z.string().trim().email('Informe um e-mail válido.').refine((value) => {
  const [local, domain] = value.split('@')
  return !!domain && !value.includes('..') && !local.startsWith('.') && !local.endsWith('.') && domain.includes('.')
}, 'Informe um e-mail válido.').transform(value => value.toLowerCase())

const clinicSignupBaseSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe seu nome completo.').max(200, 'Nome muito longo.'),
  email: emailSchema,
  password: newPasswordSchema,
  clinicName: z.string().trim().min(2, 'Informe o nome da clínica.').max(200, 'Nome muito longo.'),
  cnpj: z.string().trim().refine(isValidCnpj, 'Informe um CNPJ válido.').transform(normalizeCnpj),
  ownerAttends: z.boolean(),
  crpNumber: z.string().trim().regex(/^\d{4,8}$/, 'Informe apenas os números do CRP.').optional(),
  crpState: z.string().trim().transform(value => value.toUpperCase().replace(/^CRP-/, '').padStart(2, '0')).refine(value => /^(0[1-9]|1\d|2[0-4])$/.test(value), 'Informe uma região de CRP válida (01 a 24).').optional(),
  acceptTerms: z.boolean().refine(value => value, 'Aceite os termos para continuar.'),
  acceptPrivacy: z.boolean().refine(value => value, 'Aceite a Política de Privacidade para continuar.'),
  termsVersion: z.literal(signupTermsVersion),
  privacyVersion: z.literal(signupTermsVersion),
}).strict()

function requireProfessionalRegistration(values: { ownerAttends: boolean, crpNumber?: string, crpState?: string }, context: z.RefinementCtx) {
  if (!values.ownerAttends) return
  if (!values.crpNumber) context.addIssue({ code: z.ZodIssueCode.custom, path: ['crpNumber'], message: 'Informe o número do CRP.' })
  if (!values.crpState) context.addIssue({ code: z.ZodIssueCode.custom, path: ['crpState'], message: 'Escolha a região do CRP.' })
}

export const clinicSignupPayloadSchema = clinicSignupBaseSchema.superRefine(requireProfessionalRegistration)

export const clinicSignupFormSchema = clinicSignupBaseSchema.extend({
  confirmPassword: z.string().min(8, 'Confirme sua senha.'),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: 'As senhas precisam ser iguais.' })
  }
  requireProfessionalRegistration(values, context)
})

export const clinicSignupResponseSchema = z.object({
  emailStatus: z.enum(['pending', 'verified']),
  verificationDelivery: z.enum(['sent', 'failed', 'disabled']),
  token: z.string().min(1).optional(),
}).strict()

export const createClinicPayloadSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da clínica.').max(200, 'Nome muito longo.'),
  cnpj: z.string().trim().refine(isValidCnpj, 'Informe um CNPJ válido.').transform(normalizeCnpj),
  ownerAttends: z.boolean(),
  crpNumber: z.string().trim().regex(/^\d{4,8}$/, 'Informe apenas os números do CRP.').optional(),
  crpState: z.string().trim().transform(value => value.toUpperCase().replace(/^CRP-/, '').padStart(2, '0')).refine(value => /^(0[1-9]|1\d|2[0-4])$/.test(value), 'Informe uma região de CRP válida (01 a 24).').optional(),
}).strict().superRefine((values, context) => {
  if (!values.ownerAttends) return
  if (!values.crpNumber) context.addIssue({ code: z.ZodIssueCode.custom, path: ['crpNumber'], message: 'Informe o número do CRP.' })
  if (!values.crpState) context.addIssue({ code: z.ZodIssueCode.custom, path: ['crpState'], message: 'Escolha a região do CRP.' })
})

export const createClinicResponseSchema = z.object({ organizationId: z.string().uuid() }).strict()
export type ClinicSignupForm = z.infer<typeof clinicSignupFormSchema>
