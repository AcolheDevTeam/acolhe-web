import { z } from 'zod'

export const createPatientSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email(),
  birthDate: z.string().date().optional(),
  cpf: z.string().length(11).optional(),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>

export const patientSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  status: z.string(),
  relationshipStatus: z.string().default('pending'),
  createdAt: z.string(),
}).passthrough()

export const patientInvitationAPISchema = z.object({
  email: z.string().email(),
  token: z.string(),
  expiresAt: z.string(),
})

export const createdPatientAPISchema = patientSchema.extend({
  invitation: patientInvitationAPISchema,
})

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
