import { endOtherSessionsSchema, tokenResponseSchema } from '~/schemas/account-settings'

// Encerra todos os outros aparelhos, com a senha atual. A API devolve um token
// novo para este navegador, que substitui o cookie. A senha não é logada nem
// guardada: segue direto para a API.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = endOtherSessionsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Informe a senha atual.' })
  }
  const res = await apiFetch<unknown>(event, '/me/sessions/end-others', { method: 'POST', body: parsed.data })
  setSessionCookie(event, tokenResponseSchema.parse(res).token)
  return { ok: true }
})
