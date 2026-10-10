import { z } from 'zod'
import { newPasswordSchema } from './password'

// Ajustes da psicóloga (ACO-98): Perfil e Segurança. Regras iguais às da API.

// Durações oferecidas no perfil (protótipo "Perfil"); a API aceita de 15 a 480.
export const sessionDurationOptions = [30, 45, 50, 60] as const

const phoneDigits = (value: string) => value.replace(/\D/g, '').length

export const profileUpdateSchema = z.object({
  fullName: z.string().trim()
    .min(1, 'Informe o nome completo.')
    .max(200, 'O nome completo pode ter até 200 caracteres.'),
  socialName: z.string().trim().max(200, 'O nome social pode ter até 200 caracteres.').default(''),
  phone: z.string().trim()
    .max(32, 'O telefone pode ter até 32 caracteres.')
    .refine(
      value => !value || (/^[+0-9() .-]+$/.test(value) && phoneDigits(value) >= 8 && phoneDigits(value) <= 15),
      'Informe um telefone válido, com DDD.',
    )
    .default(''),
  approach: z.string().trim().max(100, 'A abordagem pode ter até 100 caracteres.').default(''),
  defaultSessionMinutes: z.number({ invalid_type_error: 'Escolha a duração padrão.' })
    .int('Escolha a duração padrão.')
    .min(15, 'A duração padrão precisa ter pelo menos 15 minutos.')
    .max(480, 'A duração padrão pode ter até 480 minutos.'),
})

export const profileSchema = z.object({
  fullName: z.string(),
  socialName: z.string().nullable(),
  phone: z.string().nullable(),
  approach: z.string().nullable(),
  defaultSessionMinutes: z.number().int(),
  crpNumber: z.string(),
  crpState: z.string(),
  crpStatus: z.string(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.').max(1024, 'Senha atual inválida.'),
  newPassword: newPasswordSchema,
})

export const activeSessionSchema = z.object({
  id: z.string().uuid(),
  userAgent: z.string(),
  ipPrefix: z.string(),
  startedAt: z.string().datetime({ offset: true }),
  lastSeenAt: z.string().datetime({ offset: true }),
  current: z.boolean(),
})

export const tokenResponseSchema = z.object({ token: z.string().min(1) })

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type Profile = z.infer<typeof profileSchema>
export type ChangePassword = z.infer<typeof changePasswordSchema>
export type ActiveSession = z.infer<typeof activeSessionSchema>
