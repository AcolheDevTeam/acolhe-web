import { createAppointmentSchema } from '~/schemas/appointment'
import type { Appointment } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => createAppointmentSchema.parse(value))
  return await apiFetch<Appointment>(event, '/appointments', { method: 'POST', body })
})
