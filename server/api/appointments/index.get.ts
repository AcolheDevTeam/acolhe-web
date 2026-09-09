import { appointmentSchema } from '~/schemas/appointment'

export default defineEventHandler(async (event) => {
  const response = await apiFetch<unknown>(event, '/appointments')
  return appointmentSchema.array().parse(response)
})
