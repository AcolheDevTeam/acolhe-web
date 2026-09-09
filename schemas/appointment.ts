import { z } from 'zod'

export const appointmentStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'completed',
  'canceled',
  'no_show',
])

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  psychologistId: z.string().uuid(),
  scheduledFor: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  modality: z.enum(['in_person', 'online']),
  status: appointmentStatusSchema,
  createdAt: z.string().datetime(),
})

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  scheduledFor: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  modality: z.enum(['in_person', 'online']).optional(),
})

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
