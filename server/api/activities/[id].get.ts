import type { Activity } from '~/types'
import { idParamSchema } from '~/schemas/common'

// Detalhe de uma atividade (resposta do paciente) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  return await apiFetch<Activity>(event, `/activities/${id}`)
})
