// Autentica contra a API Go e guarda o token num cookie httpOnly.
// O token nunca é exposto ao JavaScript do cliente.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const res = await $fetch<{ token: string; user: unknown }>(`${config.apiUrl}/login`, {
    method: 'POST',
    body,
  })

  setCookie(event, 'acolhe_session', res.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    secure: !import.meta.dev,
  })

  return res.user
})
