import { patientCheckinsSchema } from '~/schemas/patient'
import { idParamSchema } from '~/schemas/common'
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/checkins?patientId=${id}`)
  return patientCheckinsSchema.parse(response)
})
