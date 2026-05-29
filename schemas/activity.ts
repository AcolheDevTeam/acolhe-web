import { z } from 'zod'

export const assignActivitySchema = z.object({
  templateId: z.string().uuid(),
  patientId: z.string().uuid(),
  dueAt: z.string().datetime().optional(),
})

export type AssignActivityInput = z.infer<typeof assignActivitySchema>
