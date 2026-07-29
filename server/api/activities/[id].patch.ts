import { reviewActivitySchema } from '~/schemas/activity'
import { idParamSchema } from '~/schemas/common'
import type { Activity } from '~/types'

// Atualiza uma atividade (ex.: marcar como revisada) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const body = await readValidatedBody(event, value => reviewActivitySchema.parse(value))
  return await apiFetch<Activity>(event, `/activities/${id}`, { method: 'PATCH', body })
})
