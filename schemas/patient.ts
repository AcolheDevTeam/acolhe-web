import { z } from 'zod'

export const createPatientSchema = z.object({
  fullName: z.string().min(2).max(200),
  birthDate: z.string().date().optional(),
  cpf: z.string().length(11).optional(),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>
