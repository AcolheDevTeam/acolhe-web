import { z } from 'zod'

export const sessionNotesSchema = z.string().trim()
  .max(10000, 'A evolução deve ter no máximo 10.000 caracteres')
  .refine(value => new TextEncoder().encode(value).length <= 10000, 'O texto da evolução excede o limite de 10 KB')
  .default('')

export const updateSessionNotesSchema = z.object({
  notes: sessionNotesSchema,
  version: z.number().int().positive(),
})

// Contrato entre frontend e backend — espelha as regras das queries.
export const createSessionSchema = z.object({
  patientId: z.string({ required_error: 'Selecione um paciente' }).uuid('Selecione um paciente'),
  occurredAt: z.string({ required_error: 'Informe a data e a hora da sessão' })
    .datetime({ message: 'Informe a data e a hora da sessão' })
    .refine(value => new Date(value) >= new Date('1900-01-01T00:00:00Z'),
      'A data da sessão deve ser a partir de 01/01/1900'),
  notes: sessionNotesSchema,
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
