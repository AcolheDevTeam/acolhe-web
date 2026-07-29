import { z } from 'zod'

export const generateDocumentSchema = z.object({
  patientId: z.string().uuid(),
  type: z.string().trim().min(1).max(100),
})

export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>
