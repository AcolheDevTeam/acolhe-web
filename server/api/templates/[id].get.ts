import { activityTemplateDetailSchema } from '~/schemas/activity-template'
import { idParamSchema } from '~/schemas/common'

// Detalhe de um template com campos (inclui arquivados e versões antigas).
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, (value) => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/activities/templates/${id}`)
  return activityTemplateDetailSchema.parse(response)
})
