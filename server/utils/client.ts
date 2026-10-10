import type { H3Event } from 'h3'

// Aparelho do navegador para a API (ACO-98): o User-Agent e o IP chegam à API
// como os da requisição original, não os do servidor do Nuxt. A API guarda só
// a rede do IP, para a lista "Sessões ativas" em Ajustes › Segurança.
export function clientHeaders(event: H3Event): Record<string, string> {
  const headers: Record<string, string> = {}
  const userAgent = getRequestHeader(event, 'user-agent')
  if (userAgent) headers['User-Agent'] = userAgent.slice(0, 512)
  const ip = getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event, { xForwardedFor: true })
  if (ip) headers['X-Forwarded-For'] = ip
  return headers
}
