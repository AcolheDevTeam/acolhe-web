import { z } from 'zod'

// NOTA: a API Go ainda não expõe endpoint para atribuir atividade
// (não há POST /activities/assignments). Este schema fica pronto para quando
// esse endpoint existir; por ora não há formulário que o consuma.
export const assignActivitySchema = z.object({
  templateId: z.string().uuid(),
  patientId: z.string().uuid(),
  dueAt: z.string().datetime().optional(),
})

export type AssignActivityInput = z.infer<typeof assignActivitySchema>
