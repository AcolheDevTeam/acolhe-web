import type { Session } from '~/types'
import { updateSessionNotesSchema } from '~/schemas/session'
import { idParamSchema } from '~/schemas/common'
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const body = await readValidatedBody(event, value => updateSessionNotesSchema.parse(value))
  return await apiFetch<Session>(event, `/sessions/${id}/notes`, { method: 'PUT', body })
})
