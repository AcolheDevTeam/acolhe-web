import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').refine((value) => {
    const [local, domain] = value.split('@')
    return !value.includes('..') && !local.startsWith('.') && !local.endsWith('.') && domain.includes('.')
  }, 'Informe um e-mail válido.').transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Mínimo de 8 caracteres.').max(128, 'Máximo de 128 caracteres.'),
  confirmPassword: z.string().min(8, 'Confirme sua senha.'),
  fullName: z.string().trim().min(2, 'Informe seu nome completo.').max(200, 'Nome muito longo.'),
  crpNumber: z.string().trim().regex(/^\d{4,8}$/, 'Informe apenas os números do CRP.'),
  crpState: z.string().trim().transform((value) => value.toUpperCase().replace(/^CRP-/, '').padStart(2, '0')).refine((value) => /^(0[1-9]|1\d|2[0-4])$/.test(value), 'Informe uma região de CRP válida (01 a 24).'),
  cpf: z.string().trim().regex(/^(|\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/, 'Informe um CPF válido.'),
  approach: z.string().trim().max(100, 'Abordagem muito longa.').optional(),
  acceptTerms: z.boolean().refine((value) => value, 'Aceite os termos para continuar.'),
  acceptPrivacy: z.boolean().refine((value) => value, 'Aceite a Política de Privacidade para continuar.'),
  termsVersion: z.literal('0.3'),
  privacyVersion: z.literal('0.3'),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: 'As senhas precisam ser iguais.' })
  }
})

export type SignupForm = z.infer<typeof signupSchema>

export const signupTermsVersion = '0.3' as const
