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
  // Ausente mantém o telefone gravado (ex.: não pôde ser decifrado agora);
  // vazio apaga.
  phone: z.string().trim()
    .max(32, 'O telefone pode ter até 32 caracteres.')
    .refine(
      value => !value || (/^[+0-9() .-]+$/.test(value) && phoneDigits(value) >= 8 && phoneDigits(value) <= 15),
      'Informe um telefone válido, com DDD.',
    )
    .optional(),
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
  // Há telefone gravado, mas a API não conseguiu decifrá-lo agora.
  phoneUnavailable: z.boolean().optional(),
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

// "Encerrar todas as outras" pede a senha atual, como a troca de senha.
export const endOtherSessionsSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.').max(1024, 'Senha atual inválida.'),
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
