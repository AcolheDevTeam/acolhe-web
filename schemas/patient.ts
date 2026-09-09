import { z } from 'zod'

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

export const patientCheckinSchema = z.object({
  id: z.string().uuid(),
  mood: z.number().int().min(1).max(5),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
})

export const patientCheckinsSchema = z.array(patientCheckinSchema)

export const patientProcessSummarySchema = z.object({
  sessionCount: z.number().int().nonnegative(),
  pendingActivityCount: z.number().int().nonnegative(),
  checkinCount: z.number().int().nonnegative(),
})

export const patientCheckinInputSchema = z.object({
  mood: z.number().int().min(1).max(5),
  note: z.string().max(1000).optional(),
}).strict()
