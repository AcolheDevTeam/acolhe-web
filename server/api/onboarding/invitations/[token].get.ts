import { invitationSchema, invitationTokenSchema } from '~/schemas/onboarding'

export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(
    event,
    value => invitationTokenSchema.parse(value),
  )
  const response = await apiFetch<unknown>(
    event,
    `/onboarding/invitations/${encodeURIComponent(token)}`,
  )
  return invitationSchema.parse(response)
})
