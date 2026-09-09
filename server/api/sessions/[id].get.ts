import type { Session } from '~/types'
import { idParamSchema } from '~/schemas/common'

// Detalhe de uma sessão — proxy autenticado para a API Go.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  return await apiFetch<Session>(event, `/sessions/${id}`)
})
