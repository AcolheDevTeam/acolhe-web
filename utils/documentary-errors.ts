import { ZodError } from 'zod'
import { apiErrorInfo, apiErrorMessage } from './api-error'

// Mensagens do Registro Documental por caso (regra A6, ACO-84). O BFF manda o
// motivo do 403 em `data.reason`, nunca o texto da API.
export type DocumentaryForbiddenReason = 'read_only' | 'not_author'

/** Motivo do 403 documental informado pelo BFF, se houver. */
export function documentaryForbiddenReason(error: unknown): DocumentaryForbiddenReason | undefined {
  const reason = (error as { data?: { data?: { reason?: unknown } } } | null)?.data?.data?.reason
  return reason === 'read_only' || reason === 'not_author' ? reason : undefined
}

export function documentaryErrorText(error: unknown): string {
  // Resposta fora do contrato: não é falta de conexão.
  if (error instanceof ZodError) {
    return 'O servidor respondeu de um jeito inesperado. Recarregue a página; se continuar, avise o suporte.'
  }
  const { status } = apiErrorInfo(error)
  if (status === 403) {
    return documentaryForbiddenReason(error) === 'read_only'
      ? 'Paciente ou vínculo clínico inativo. O caderno está disponível somente para leitura.'
      : 'Este caderno é privado da(o) psicóloga(o) autor(a) e não está disponível para a sua conta.'
  }
  return apiErrorMessage(error, {
    400: 'Confira a revisão, a categoria e o limite de 200.000 bytes do texto.',
    401: 'Sua sessão expirou. Seu texto continua aqui; entre novamente em outra aba.',
    404: 'Este caderno ou esta versão não está disponível para sua conta.',
    409: 'Este caderno foi atualizado em outra aba. Compare os textos antes de tentar novamente.',
    500: 'Ocorreu um erro inesperado no Registro Documental. Tente novamente em instantes.',
    502: 'Não foi possível falar com o serviço do Registro Documental. Verifique a conexão e tente de novo.',
    503: 'Não foi possível validar a criptografia do caderno. O conteúdo foi preservado; solicite a verificação da configuração.',
  })
}
