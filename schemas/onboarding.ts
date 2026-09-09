import { z } from 'zod'

export const invitationTokenSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
})

export const consentDocumentSchema = z.object({
  id: z.string().uuid(),
  scope: z.enum(['health_data', 'communications', 'aggregate_statistics']),
  version: z.string(),
  title: z.string(),
  content: z.string(),
  contentSha256: z.string().regex(/^[0-9a-f]{64}$/),
  required: z.boolean(),
  publishedAt: z.string().datetime({ offset: true }),
})

export const invitationSchema = z.object({
  patientName: z.string(),
  psychologistName: z.string(),
  psychologistCrp: z.string(),
  email: z.string().email(),
  expiresAt: z.string().datetime({ offset: true }),
  documents: consentDocumentSchema.array().min(1),
})

export const acceptInvitationSchema = z.object({
	password: z.string().min(8).max(72),
	acceptedDocumentIds: z.string().uuid().array().min(1),
})

export const acceptInvitationPasswordSchema = z.object({
	password: z.string().min(8).max(72),
})
