import { invitationTokenSchema } from '~/schemas/onboarding'

export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(event, value => invitationTokenSchema.parse(value))
  return await apiFetch(event, `/invites/${encodeURIComponent(token)}`)
})
