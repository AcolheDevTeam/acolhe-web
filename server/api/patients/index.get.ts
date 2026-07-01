import type { Patient } from '~/types'

// Lista de pacientes — proxy autenticado para a API Go.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return await apiFetch<Patient[]>(event, '/patients', { query })
})
