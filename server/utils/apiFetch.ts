import type { H3Event } from 'h3'
import type { NitroFetchOptions } from 'nitropack'

// Proxy autenticado para a API Go. Lê o token do cookie httpOnly `acolhe_session`
// e o envia como Bearer — o token nunca é exposto ao browser (LGPD).
export async function apiFetch<T>(
  event: H3Event,
  path: string,
  opts: NitroFetchOptions<string> = {},
): Promise<T> {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'acolhe_session')

  return await $fetch<T>(`${config.apiUrl}${path}`, {
    ...opts,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  }) as T
}
