import { appointmentSchema } from '~/schemas/appointment'
import { idParamSchema } from '~/schemas/common'
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  return appointmentSchema.parse(await apiFetch(event, `/appointments/${id}`))
})
