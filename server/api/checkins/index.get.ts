import { patientQuerySchema } from '~/schemas/common'
import type { Checkin } from '~/types'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => patientQuerySchema.parse(value))
  return await apiFetch<Checkin[]>(event, '/checkins', { query })
})
