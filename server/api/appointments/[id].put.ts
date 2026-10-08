import { appointmentSchema, rescheduleAppointmentSchema } from '~/schemas/appointment'
import { idParamSchema } from '~/schemas/common'
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const body = await readValidatedBody(event, value => rescheduleAppointmentSchema.parse(value))
  return appointmentSchema.parse(await apiFetch(event, `/appointments/${id}`, { method: 'PUT', body }))
})
