// Tradução centralizada de erros da API para o usuário (regra A6 do guia).
//
// Os formulários chamam apiErrorMessage(err, { 409: '…', default: '…' }) no
// catch. Cada status conhecido tem um texto padrão em português; o formulário
// sobrescreve só o que tem significado próprio no seu contexto (ex.: 403 em
// "Nova sessão" quer dizer vínculo não ativo). Nunca mostramos a mensagem
// técnica da API nem um erro genérico que esconda a causa.

export type ApiErrorOverrides = Partial<Record<number | 'default' | 'network', string>>

export interface ApiErrorInfo {
  status?: number
  /** Mensagem técnica devolvida pela API, só para depuração. */
  technical?: string
}

const defaultMessages: Record<number, string> = {
  400: 'Alguns dados não foram aceitos. Revise o formulário e tente de novo.',
  401: 'Sua sessão expirou. Entre novamente para continuar.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Não encontramos o registro. Ele pode ter sido removido.',
  409: 'Esta ação conflita com um registro existente.',
  410: 'Este recurso não está mais disponível.',
  422: 'Alguns dados não foram aceitos. Revise o formulário e tente de novo.',
  429: 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.',
  500: 'Ocorreu um erro inesperado. Tente novamente em instantes.',
  502: 'O serviço está indisponível no momento. Tente novamente em instantes.',
  503: 'O serviço está indisponível no momento. Tente novamente em instantes.',
  504: 'O serviço demorou para responder. Tente novamente em instantes.',
}

const networkMessage = 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'

/** Extrai status e mensagem técnica de um erro do $fetch/useFetch (ofetch) ou do h3. */
export function apiErrorInfo(error: unknown): ApiErrorInfo {
  if (!error || typeof error !== 'object') return {}
  const err = error as {
    statusCode?: number
    status?: number
    response?: { status?: number, _data?: { message?: string, statusMessage?: string } }
    data?: { message?: string, statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  const status = err.statusCode ?? err.status ?? err.response?.status
  const technical = err.data?.message ?? err.response?._data?.message ?? err.data?.statusMessage ?? err.statusMessage ?? err.message
  return { status, technical }
}

export function apiErrorMessage(error: unknown, overrides: ApiErrorOverrides = {}): string {
  const { status } = apiErrorInfo(error)
  if (status == null) return overrides.network ?? overrides.default ?? networkMessage
  if (overrides[status]) return overrides[status] as string
  if (status >= 500) return overrides.default ?? defaultMessages[status] ?? defaultMessages[500]
  return defaultMessages[status] ?? overrides.default ?? 'Não foi possível concluir a ação. Tente de novo.'
}

/** Verdadeiro para 401: a sessão acabou e o usuário precisa entrar de novo. */
export function isSessionExpired(error: unknown): boolean {
  return apiErrorInfo(error).status === 401
}
