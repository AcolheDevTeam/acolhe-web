import type { User } from '~/types'
import { idParamSchema } from '~/schemas/common'

// Troca de workspace: a API confere o vínculo e emite um token novo, que
// substitui o cookie. O cliente recarrega a página para não reaproveitar cache
// de outro workspace.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const res = await apiFetch<{ token: string, user: User }>(event, `/workspaces/${id}/switch`, { method: 'POST' })
  setSessionCookie(event, res.token)
  return res.user
})
