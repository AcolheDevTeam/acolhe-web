import type { Appointment } from '~/types'

export default defineEventHandler(async (event) => {
  return await apiFetch<Appointment[]>(event, '/appointments')
})
