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

  try {
    return await $fetch<T>(`${config.apiUrl}${path}`, {
      ...opts,
      headers: {
        ...clientHeaders(event),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
    }) as T
  }
  catch (error) {
    throw relayApiError(error)
  }
}

// Em produção o Nitro troca por "Server Error" a mensagem de qualquer erro que
// não seja H3Error, e o cliente perdia o motivo do 4xx (ex.: qual 409 da agenda,
// ACO-83). Aqui o status segue e, só em 4xx, a mensagem curta da API vai em
// `data.message`, para o front reconhecer o caso (nunca para exibi-la). 5xx e
// falhas de rede não levam detalhe nenhum.
export function relayApiError(error: unknown): unknown {
  const status = (error as { response?: { status?: number } })?.response?.status
  if (!status) return error
  const apiMessage = (error as { data?: { message?: unknown } }).data?.message
  return createError({
    statusCode: status,
    data: status < 500 && typeof apiMessage === 'string' ? { message: apiMessage } : undefined,
  })
}
