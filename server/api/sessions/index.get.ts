import type { Session } from '~/types'

// Lista de sessões (opcionalmente filtrada por ?patient=) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await apiFetch<Session[]>(event, '/sessions', { query })
})
