import { idParamSchema } from '~/schemas/common'
import type { Activity } from '~/types'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  return await apiFetch<Activity>(event, `/activities/${id}`, {
    method: 'PATCH',
    body: { status: 'reviewed' },
  })
})
