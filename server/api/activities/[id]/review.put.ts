import { idParamSchema } from '~/schemas/common'
import { activityReviewDetailSchema } from '~/schemas/activity'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/activities/${id}/review`, {
    method: 'PUT',
  })
  return activityReviewDetailSchema.parse(response)
})
