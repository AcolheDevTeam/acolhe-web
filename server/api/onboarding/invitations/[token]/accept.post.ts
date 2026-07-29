import { acceptInvitationSchema, invitationTokenSchema } from '~/schemas/onboarding'

export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(
    event,
    value => invitationTokenSchema.parse(value),
  )
  const body = await readValidatedBody(event, value => acceptInvitationSchema.parse(value))
  return await apiFetch(event, `/onboarding/invitations/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
    body,
  })
})
