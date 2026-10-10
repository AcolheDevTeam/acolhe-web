// Autentica contra a API Go e guarda o token num cookie httpOnly.
// O token nunca é exposto ao JavaScript do cliente.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  let res: { token: string, user: unknown }
  try {
    res = await $fetch<{ token: string, user: unknown }>(`${config.apiUrl}/login`, {
      method: 'POST',
      body,
      headers: clientHeaders(event),
    })
  }
  catch (error) {
    // 401 credencial, 403 sem vínculo ativo: o motivo chega à tela (ADR 0002).
    throw relayApiError(error)
  }

  setSessionCookie(event, res.token)
  return res.user
})
