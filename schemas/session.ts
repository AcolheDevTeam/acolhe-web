import { z } from 'zod'

// Contrato entre frontend e backend — espelha as regras das queries.
export const createSessionSchema = z.object({
  patientId: z.string().uuid(),
  psychologistId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  notes: z.string().min(1).max(10000),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
