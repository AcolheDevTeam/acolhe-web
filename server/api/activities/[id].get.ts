import type { Activity } from '~/types'

// Detalhe de uma atividade (resposta do paciente) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await apiFetch<Activity>(event, `/activities/${id}`)
})
