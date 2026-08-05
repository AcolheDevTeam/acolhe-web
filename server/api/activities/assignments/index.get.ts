import { patientQuerySchema } from '~/schemas/common'
import type { Activity } from '~/types'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => patientQuerySchema.parse(value))
  return await apiFetch<Activity[]>(event, '/activities/assignments', { query })
})
