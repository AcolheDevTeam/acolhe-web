import { z } from 'zod'

// Contrato entre frontend e backend — espelha as regras das queries.
export const createSessionSchema = z.object({
  patientId: z.string({ required_error: 'Selecione um paciente' }).uuid('Selecione um paciente'),
  occurredAt: z.string({ required_error: 'Informe a data e a hora da sessão' })
    .datetime({ message: 'Informe a data e a hora da sessão' })
    .refine((value) => {
      const occurredAt = new Date(value)
      return occurredAt >= new Date('1900-01-01T00:00:00Z')
        && occurredAt <= new Date(Date.now() + 5 * 60 * 1000)
    }, 'A sessão não pode ser registrada em uma data futura'),
  notes: z.string({ required_error: 'Descreva a evolução da sessão' })
    .trim()
    .min(1, 'Descreva a evolução da sessão')
    .max(10000, 'A evolução deve ter no máximo 10.000 caracteres'),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
