import { z } from 'zod'

export const idParamSchema = z.object({
  id: z.string().uuid(),
})

export const patientQuerySchema = z.object({
  patientId: z.string().uuid(),
})

export const optionalPatientQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
})
