import type { Activity } from '~/types'

// Atualiza uma atividade (ex.: marcar como revisada) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  return await apiFetch<Activity>(event, `/activities/${id}`, { method: 'PATCH', body })
})
