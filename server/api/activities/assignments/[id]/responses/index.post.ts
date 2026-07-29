import { idParamSchema } from '~/schemas/common'
import type { ActivityResponse } from '~/types'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  return await apiFetch<ActivityResponse>(
    event,
    `/activities/assignments/${id}/responses`,
    { method: 'POST' },
  )
})
