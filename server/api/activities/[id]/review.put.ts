import { idParamSchema } from '~/schemas/common'
import { activityReviewDetailSchema, reviewRequestSchema } from '~/schemas/activity'

// Marca como revisada e grava comentário e tags (ACO-104). O corpo é o estado
// completo da revisão; sem corpo, só marca como revisada.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const body = await readValidatedBody(event, value => reviewRequestSchema.parse(value ?? {}))
  const response = await apiFetch<unknown>(event, `/activities/${id}/review`, {
    method: 'PUT',
    body,
  })
  return activityReviewDetailSchema.parse(response)
})
