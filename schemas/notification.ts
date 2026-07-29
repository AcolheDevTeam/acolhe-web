import { z } from 'zod'

export const createReminderSchema = z.object({
  appointmentId: z.string().uuid(),
  userId: z.string().uuid(),
  scheduledFor: z.string().datetime(),
})

export type CreateReminderInput = z.infer<typeof createReminderSchema>
