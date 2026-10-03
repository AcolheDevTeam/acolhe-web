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
  patientName: z.string().optional(),
  sessionId: z.string().uuid().nullable().optional(),
  psychologistId: z.string().uuid(),
  scheduledFor: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().positive(),
  modality: z.enum(['in_person', 'online']),
  status: appointmentStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
})

const appointmentFields = {
  scheduledFor: z.string({ required_error: 'Informe a data e a hora da sessão' })
    .datetime({ offset: true, message: 'Informe uma data e hora válidas' })
    .refine(value => new Date(value) >= new Date('1900-01-01T00:00:00Z'), 'A data deve ser a partir de 01/01/1900'),
  durationMinutes: z.number({ required_error: 'Informe a duração' })
    .int('Informe a duração em minutos inteiros').min(15, 'A duração mínima é de 15 minutos').max(480, 'A duração máxima é de 480 minutos'),
  modality: z.enum(['in_person', 'online'], { required_error: 'Selecione a modalidade', invalid_type_error: 'Selecione a modalidade' }),
}

export const createAppointmentSchema = z.object({
  patientId: z.string({ required_error: 'Selecione um paciente' }).uuid('Selecione um paciente'),
  ...appointmentFields,
})

export const rescheduleAppointmentSchema = z.object(appointmentFields)

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>
