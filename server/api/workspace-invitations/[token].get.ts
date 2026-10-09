import { invitationPreviewSchema, invitationTokenSchema } from '~/schemas/workspace-invitation'

// Prévia pública do convite: o token do link é a credencial.
export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(event, value => invitationTokenSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/workspace-invitations/${token}`)
  return invitationPreviewSchema.parse(response)
})
