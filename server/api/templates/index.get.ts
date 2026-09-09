import { activityTemplateSummarySchema } from '~/schemas/activity-template'

// Biblioteca de templates (só a versão mais recente de cada linhagem, sem arquivados).
export default defineEventHandler(async (event) => {
  const response = await apiFetch<unknown>(event, '/activities/templates')
  return activityTemplateSummarySchema.array().parse(response)
})
