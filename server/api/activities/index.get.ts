import type { Activity } from '~/types'
import { optionalPatientQuerySchema } from '~/schemas/common'

// Lista de atividades (opcionalmente filtrada por ?patientId=) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => optionalPatientQuerySchema.parse(value))
  return await apiFetch<Activity[]>(event, '/activities', { query })
})
