import type { Patient } from '~/types'
import { idParamSchema } from '~/schemas/common'
import { patientSchema } from '~/schemas/patient'

// Ficha do paciente — proxy autenticado para a API Go.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/patients/${id}`)
  return patientSchema.parse(response) as Patient
})
