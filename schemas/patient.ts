import { z } from 'zod'

const earliestBirthDate = new Date('1900-01-01T00:00:00Z')

export const createPatientSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email().max(320),
  birthDate: z.preprocess(
    value => value === '' ? undefined : value,
    z.string().date().refine((value) => {
      const date = new Date(`${value}T00:00:00Z`)
      return date >= earliestBirthDate && date <= new Date()
    }, 'Data de nascimento inválida').optional(),
  ),
})

export const patientSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  status: z.enum(['onboarding', 'active', 'archived', 'deleted']),
  relationshipStatus: z.enum(['pending', 'active', 'paused', 'ended', 'transferred']),
  createdAt: z.string().datetime({ offset: true }),
}).passthrough()

export const patientInvitationAPISchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  email: z.string().email(),
  expiresAt: z.string().datetime({ offset: true }),
})

export const createdPatientAPISchema = patientSchema.extend({
  invitation: patientInvitationAPISchema,
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>
