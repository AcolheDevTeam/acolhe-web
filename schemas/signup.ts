import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'Mínimo de 8 caracteres.').max(128, 'Máximo de 128 caracteres.'),
  fullName: z.string().trim().min(2, 'Informe seu nome completo.').max(200, 'Nome muito longo.'),
  crpNumber: z.string().trim().regex(/^\d{4,8}$/, 'Informe apenas os números do CRP.'),
  crpState: z.string().trim().length(2, 'Informe a região do CRP.'),
  cpf: z.string().trim().regex(/^(|\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/, 'Informe um CPF válido.'),
  approach: z.string().trim().max(100, 'Abordagem muito longa.').optional(),
  acceptTerms: z.boolean().refine((value) => value, 'Aceite os termos para continuar.'),
  termsVersion: z.literal('0.3'),
})

export type SignupForm = z.infer<typeof signupSchema>

export const signupTermsVersion = '0.3' as const
