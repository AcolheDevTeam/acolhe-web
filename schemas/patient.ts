import { z } from 'zod'

const earliestBirthDate = new Date('1900-01-01T00:00:00Z')

export const createPatientSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  birthDate: z.preprocess(
    value => value === '' ? undefined : value,
    z.string().date().refine((value) => {
      const date = new Date(`${value}T00:00:00Z`)
      return date >= earliestBirthDate && date <= new Date()
    }, 'Data de nascimento inválida').optional(),
  ),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>
