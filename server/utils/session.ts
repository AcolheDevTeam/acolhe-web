import type { H3Event } from 'h3'

// Cookie httpOnly com o token da API: o token nunca chega ao JavaScript do
// cliente (LGPD). Login, troca de workspace e aceite de convite gravam igual.
export function setSessionCookie(event: H3Event, token: string) {
  setCookie(event, 'acolhe_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    secure: !import.meta.dev,
  })
}
