import { z } from 'zod'

// Contrato entre frontend e backend — espelha o corpo aceito por POST /sessions
// na API Go. O psicólogo é derivado do token (não vai no corpo) e as notas
// clínicas ainda não têm endpoint, sendo mantidas como rascunho local
// (ver stores/clinicalDraft.ts).
export const createSessionSchema = z.object({
  patientId: z.string().uuid(),
  occurredAt: z.string().datetime(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
