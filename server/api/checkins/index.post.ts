import { createCheckinSchema } from '~/schemas/checkin'
import type { Checkin } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => createCheckinSchema.parse(value))
  return await apiFetch<Checkin>(event, '/checkins', { method: 'POST', body })
})
