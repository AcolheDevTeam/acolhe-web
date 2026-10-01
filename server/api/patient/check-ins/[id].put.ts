import { patientCheckinInputSchema, patientCheckinSchema } from '~/schemas/patient'
import { idParamSchema } from '~/schemas/common'
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const body = await readValidatedBody(event, value => patientCheckinInputSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/patient/check-ins/${id}`, { method: 'PUT', body })
  return patientCheckinSchema.parse(response)
})
