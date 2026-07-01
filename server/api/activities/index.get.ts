import type { Activity } from '~/types'

// Lista de atividades (opcionalmente filtrada por ?patient=) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await apiFetch<Activity[]>(event, '/activities', { query })
})
