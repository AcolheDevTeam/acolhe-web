import { activityReviewDetailSchema } from '~/schemas/activity'
import { idParamSchema } from '~/schemas/common'

// Detalhe de uma atividade (resposta do paciente) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/activities/${id}`)
  return activityReviewDetailSchema.parse(response)
})
