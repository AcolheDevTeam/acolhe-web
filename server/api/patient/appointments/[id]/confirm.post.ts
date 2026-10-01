import { patientNextSessionSchema } from '~/schemas/patient'
import { idParamSchema } from '~/schemas/common'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/patient/appointments/${id}/confirm`, { method: 'POST' })
  return patientNextSessionSchema.unwrap().parse(response)
})
