import type { Session } from '~/types'
import { optionalPatientQuerySchema } from '~/schemas/common'

// Lista de sessões (opcionalmente filtrada por ?patientId=) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => optionalPatientQuerySchema.parse(value))
  return await apiFetch<Session[]>(event, '/sessions', { query })
})
