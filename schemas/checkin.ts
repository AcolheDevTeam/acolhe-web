import { z } from 'zod'

export const createCheckinSchema = z.object({
  patientId: z.string().uuid(),
  mood: z.number().int().min(1).max(5),
  note: z.string().max(2000).optional(),
})

export type CreateCheckinInput = z.infer<typeof createCheckinSchema>
