import type { Session } from '~/types'
import { updateSessionRecordSchema } from '~/schemas/session'
import { idParamSchema } from '~/schemas/common'

// Salva as quatro seções do prontuário (ACO-101) com a versão lida pela tela.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const body = await readValidatedBody(event, value => updateSessionRecordSchema.parse(value))
  return await apiFetch<Session>(event, `/sessions/${id}/record`, { method: 'PUT', body })
})
