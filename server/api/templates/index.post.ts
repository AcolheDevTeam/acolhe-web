import { activityTemplateDetailSchema, templateRequestSchema } from '~/schemas/activity-template'

// Cria a versão 1 de um template da psicóloga autenticada.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (value) => templateRequestSchema.parse(value))
  const response = await apiFetch<unknown>(event, '/activities/templates', { method: 'POST', body })
  return activityTemplateDetailSchema.parse(response)
})
