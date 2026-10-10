import type { Session } from '~/types'
import { updateSessionRecordSchema } from '~/schemas/session'
import { idParamSchema } from '~/schemas/common'

// "Concluir sessão" (ACO-101): grava as seções e trava o prontuário.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const body = await readValidatedBody(event, value => updateSessionRecordSchema.parse(value))
  return await apiFetch<Session>(event, `/sessions/${id}/conclude`, { method: 'POST', body })
})
