import { reviewActivitySchema } from '~/schemas/activity'
import type { Activity } from '~/types'

// Atualiza uma atividade (ex.: marcar como revisada) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readValidatedBody(event, value => reviewActivitySchema.parse(value))
  return await apiFetch<Activity>(event, `/activities/${id}`, { method: 'PATCH', body })
})
