import type { User } from '~/types'
import { acceptPayloadSchema, invitationTokenSchema } from '~/schemas/workspace-invitation'

// Aceite do convite: a API cria ou confirma a conta e devolve o token já no
// workspace convidado, que vira o cookie de sessão.
export default defineEventHandler(async (event) => {
  const { token } = await getValidatedRouterParams(event, value => invitationTokenSchema.parse(value))
  const body = await readValidatedBody(event, value => acceptPayloadSchema.parse(value))
  const res = await apiFetch<{ token: string, user: User }>(event, `/workspace-invitations/${token}/accept`, { method: 'POST', body })
  setSessionCookie(event, res.token)
  return res.user
})
