import { z } from 'zod'
import { CHECKIN_FEELINGS, CHECKIN_FEELING_VALUES } from '~/utils/checkin'

const earliestBirthDate = new Date('1900-01-01T00:00:00Z')

export const createPatientSchema = z.object({
  fullName: z.string({ required_error: 'Informe o nome completo' })
    .trim()
    .min(2, 'Informe o nome completo')
    .max(200, 'O nome deve ter no máximo 200 caracteres'),
  email: z.string({ required_error: 'Informe o e-mail' })
    .trim()
    .toLowerCase()
    .email('Informe um e-mail válido')
    .max(320, 'O e-mail deve ter no máximo 320 caracteres'),
  phone: z.string().trim().max(32, 'O telefone deve ter no máximo 32 caracteres')
    .refine(value => !value || (/^[+0-9() .-]+$/.test(value) && value.replace(/\D/g, '').length >= 8 && value.replace(/\D/g, '').length <= 15), 'Informe um telefone válido, com DDD').optional(),
  birthDate: z.preprocess(
    value => value === '' ? undefined : value,
    z.string().date('Data de nascimento inválida').refine((value) => {
      const date = new Date(`${value}T00:00:00Z`)
      return date >= earliestBirthDate && date <= new Date()
    }, 'A data de nascimento não pode ser futura').optional(),
  ),
})

export const patientSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  status: z.enum(['onboarding', 'active', 'archived', 'deleted']),
  relationshipStatus: z.enum(['pending', 'active', 'paused', 'ended', 'transferred']),
  createdAt: z.string().datetime({ offset: true }),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  healthConsent: z.object({
    accepted: z.boolean(),
    version: z.string(),
    decidedAt: z.string().datetime({ offset: true }),
  }).nullable().optional(),
}).passthrough()

export const invitationDeliveryStatusSchema = z.enum(['sent', 'failed', 'disabled'])

export const patientInvitationAPISchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  email: z.string().email(),
  expiresAt: z.string().datetime({ offset: true }),
  // APIs anteriores ao envio por e-mail não informam o campo: tratar como desabilitado.
  deliveryStatus: invitationDeliveryStatusSchema.default('disabled'),
})

export const createdPatientAPISchema = patientSchema.extend({
  invitation: patientInvitationAPISchema,
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>

// Contratos patient-scoped da área do paciente (ACO-56/ACO-58). Consumidos só pelo BFF.
export const patientContextSchema = z.object({
  patientId: z.string().uuid(),
  fullName: z.string(),
  relationshipStatus: z.string(),
  consented: z.boolean(),
})

export const patientNextSessionSchema = z.object({
  id: z.string().uuid(),
  scheduledFor: z.string(),
  durationMinutes: z.number(),
  modality: z.string(),
  status: z.string(),
}).nullable()

export const patientPendingActivitySchema = z.array(z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  scheduledFor: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
}))

// ACO-103: sono e sentimentos são opcionais. Na resposta, um sentimento que o
// front ainda não conhece não derruba a tela (aparece pelo código).
export const patientCheckinSchema = z.object({
  day: z.string().date(),
  updatedAt: z.string().datetime({ offset: true }),
  id: z.string().uuid(),
  mood: z.number().int().min(1).max(5),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
  sleepBedtime: z.string().nullable().optional(),
  sleepWakeTime: z.string().nullable().optional(),
  sleepMinutes: z.number().int().nonnegative().nullable().optional(),
  sleepQuality: z.number().int().min(1).max(5).nullable().optional(),
  feelings: z.array(z.string()).nullable().optional().transform(value => value ?? []),
})

export const patientCheckinsSchema = z.array(patientCheckinSchema)

export const patientProcessSummarySchema = z.object({
  sessionCount: z.number().int().nonnegative(),
  pendingActivityCount: z.number().int().nonnegative(),
  checkinCount: z.number().int().nonnegative(),
})

const sleepClockSchema = (field: string) => z.string({ invalid_type_error: `Horário em que ${field} inválido.` })
  .regex(/^([01]\d|2[0-3]):(00|15|30|45)$/, `Horário em que ${field} inválido: use HH:MM, em passos de 15 minutos.`)

export const patientCheckinInputSchema = z.object({
  mood: z.number({ required_error: 'Escolha como você está, de 1 a 5.', invalid_type_error: 'Escolha como você está, de 1 a 5.' })
    .int('Escolha como você está, de 1 a 5.').min(1, 'Escolha como você está, de 1 a 5.').max(5, 'Escolha como você está, de 1 a 5.'),
  note: z.string().trim().max(1000, 'A observação deve ter no máximo 1.000 caracteres').optional(),
  sleepBedtime: sleepClockSchema('dormiu').nullable().optional(),
  sleepWakeTime: sleepClockSchema('acordou').nullable().optional(),
  sleepQuality: z.number({ invalid_type_error: 'A qualidade do sono vai de 1 a 5.' })
    .int('A qualidade do sono vai de 1 a 5.').min(1, 'A qualidade do sono vai de 1 a 5.').max(5, 'A qualidade do sono vai de 1 a 5.')
    .nullable().optional(),
  feelings: z.array(z.enum(CHECKIN_FEELING_VALUES, { errorMap: () => ({ message: 'Escolha os sentimentos da lista.' }) }))
    .max(CHECKIN_FEELINGS.length, 'Escolha os sentimentos da lista.').optional(),
}).strict().superRefine((value, ctx) => {
  const bed = value.sleepBedtime ?? null
  const wake = value.sleepWakeTime ?? null
  if ((bed == null) !== (wake == null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [bed == null ? 'sleepBedtime' : 'sleepWakeTime'], message: 'Informe o horário em que dormiu e o horário em que acordou, ou deixe os dois em branco.' })
  } else if (bed != null && bed === wake) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sleepWakeTime'], message: 'O horário em que acordou precisa ser diferente do horário em que dormiu.' })
  }
})

// "Meu prontuário" da paciente (ACO-88): sessões já ocorridas, a mais recente
// primeiro. A lista não traz o texto; `hasNotes` diz se há algum registro. A
// leitura de uma sessão traz as seções do prontuário (ACO-101), o texto livre
// dos registros antigos (`notes`, exibido como "Anotações") e a duração.
export const patientRecordSessionSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().positive(),
  occurredAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  version: z.number().int().positive(),
  modality: z.string().nullable(),
  hasNotes: z.boolean(),
})

export const patientRecordSessionsSchema = z.array(patientRecordSessionSchema)

export const patientRecordSessionDetailSchema = patientRecordSessionSchema.extend({
  durationMinutes: z.number().int().positive().nullable().optional(),
  notes: z.string(),
  demand: z.string().default(''),
  evolution: z.string().default(''),
  conduct: z.string().default(''),
  referral: z.string().default(''),
  concluded: z.boolean().default(false),
})

export type PatientRecordSession = z.infer<typeof patientRecordSessionSchema>
export type PatientRecordSessionDetail = z.infer<typeof patientRecordSessionDetailSchema>
