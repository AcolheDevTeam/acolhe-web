import type { Patient } from '~/types'
import { patientSchema } from '~/schemas/patient'

// Lista de pacientes — proxy autenticado para a API Go.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const response = await apiFetch<unknown>(event, '/patients', { query })
  return patientSchema.array().parse(response) as Patient[]
})
