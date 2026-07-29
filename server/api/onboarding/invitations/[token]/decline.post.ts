import { invitationTokenSchema } from '~/schemas/onboarding'

export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(
    event,
    value => invitationTokenSchema.parse(value),
  )
  await apiFetch(event, `/onboarding/invitations/${encodeURIComponent(token)}/decline`, {
    method: 'POST',
  })
  setResponseStatus(event, 204)
})
