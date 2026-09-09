import { appointmentSchema, updateAppointmentStatusSchema } from '~/schemas/appointment'
import { idParamSchema } from '~/schemas/common'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const body = await readValidatedBody(event, value => updateAppointmentStatusSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/appointments/${id}/status`, {
    method: 'PUT',
    body,
  })
  return appointmentSchema.parse(response)
})
