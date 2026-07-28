import { z } from 'zod'

// Contrato entre frontend e backend — espelha as regras das queries.
export const createSessionSchema = z.object({
  patientId: z.string().uuid(),
  occurredAt: z.string().datetime().refine((value) => {
    const occurredAt = new Date(value)
    return occurredAt >= new Date('1900-01-01T00:00:00Z')
      && occurredAt <= new Date(Date.now() + 5 * 60 * 1000)
  }, 'Data da sessão inválida'),
  notes: z.string().trim().min(1).max(10000),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
