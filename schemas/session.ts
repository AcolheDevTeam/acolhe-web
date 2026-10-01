import { z } from 'zod'

// Contrato entre frontend e backend — espelha as regras das queries.
export const createSessionSchema = z.object({
  patientId: z.string({ required_error: 'Selecione um paciente' }).uuid('Selecione um paciente'),
  occurredAt: z.string({ required_error: 'Informe a data e a hora da sessão' })
    .datetime({ message: 'Informe a data e a hora da sessão' })
    .refine(value => new Date(value) >= new Date('1900-01-01T00:00:00Z'),
      'A data da sessão deve ser a partir de 01/01/1900'),
  notes: z.string()
    .trim()
    .max(10000, 'A evolução deve ter no máximo 10.000 caracteres')
    .default(''),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
