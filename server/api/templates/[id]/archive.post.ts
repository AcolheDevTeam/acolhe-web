import { activityTemplateDetailSchema } from '~/schemas/activity-template'
import { idParamSchema } from '~/schemas/common'

// Arquiva um template: sai da biblioteca, atividades já atribuídas continuam válidas.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, (value) => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/activities/templates/${id}/archive`, { method: 'POST' })
  return activityTemplateDetailSchema.parse(response)
})
