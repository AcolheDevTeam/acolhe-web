import type { Patient } from '~/types'

// Ficha do paciente — proxy autenticado para a API Go.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await apiFetch<Patient>(event, `/patients/${id}`)
})
