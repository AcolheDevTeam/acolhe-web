import { invitationTokenSchema } from '~/schemas/onboarding'
import { acceptInvitationPasswordSchema } from '~/schemas/onboarding'

export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(event, value => invitationTokenSchema.parse(value))
  const body = await readValidatedBody(event, value => acceptInvitationPasswordSchema.parse(value))
  return await apiFetch(event, `/invites/${encodeURIComponent(token)}/accept`, { method: 'POST', body })
})
