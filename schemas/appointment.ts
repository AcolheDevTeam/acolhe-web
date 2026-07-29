import { z } from 'zod'

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  scheduledFor: z.string().datetime(),
  durationMinutes: z.number().int().positive().optional(),
  modality: z.enum(['in_person', 'online']).optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
