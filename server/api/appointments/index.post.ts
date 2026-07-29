import { appointmentSchema, createAppointmentSchema } from '~/schemas/appointment'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => createAppointmentSchema.parse(value))
  const response = await apiFetch<unknown>(event, '/appointments', { method: 'POST', body })
  return appointmentSchema.parse(response)
})
