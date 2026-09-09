import { assignActivitySchema } from '~/schemas/activity'
import type { Activity } from '~/types'

// Atribui uma atividade a um paciente — valida no servidor (contrato Zod).
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => assignActivitySchema.parse(b))
  return await apiFetch<Activity>(event, '/activities', { method: 'POST', body })
})
