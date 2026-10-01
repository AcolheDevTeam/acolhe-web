import type { Session } from '~/types'
import { idParamSchema } from '~/schemas/common'
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  return await apiFetch<Session>(event, `/appointments/${id}/session`, { method: 'POST' })
})
