import { activityTemplateDetailSchema, templateRequestSchema } from '~/schemas/activity-template'
import { idParamSchema } from '~/schemas/common'

// Edita um template. Se ele já foi atribuído, a API devolve uma versão nova (id
// diferente); o cliente deve navegar para o id retornado.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, (value) => idParamSchema.parse(value))
  const body = await readValidatedBody(event, (value) => templateRequestSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/activities/templates/${id}`, { method: 'PUT', body })
  return activityTemplateDetailSchema.parse(response)
})
