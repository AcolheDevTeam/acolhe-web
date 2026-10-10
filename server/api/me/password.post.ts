import { changePasswordSchema, tokenResponseSchema } from '~/schemas/account-settings'

// Troca de senha logada (ACO-98). A API encerra as outras sessões e devolve um
// token novo para este navegador, que substitui o cookie. As senhas não são
// logadas nem guardadas: seguem direto para a API.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Senha inválida.' })
  }
  const res = await apiFetch<unknown>(event, '/me/password', { method: 'POST', body: parsed.data })
  setSessionCookie(event, tokenResponseSchema.parse(res).token)
  return { ok: true }
})
