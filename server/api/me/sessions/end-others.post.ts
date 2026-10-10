import { tokenResponseSchema } from '~/schemas/account-settings'

// Encerra todos os outros aparelhos. A API devolve um token novo para este
// navegador, que substitui o cookie.
export default defineEventHandler(async (event) => {
  const res = await apiFetch<unknown>(event, '/me/sessions/end-others', { method: 'POST' })
  setSessionCookie(event, tokenResponseSchema.parse(res).token)
  return { ok: true }
})
