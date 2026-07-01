import type { Session } from '~/types'

// Detalhe de uma sessão — proxy autenticado para a API Go.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await apiFetch<Session>(event, `/sessions/${id}`)
})
