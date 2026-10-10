import { apiErrorInfo, apiErrorMessage } from './api-error'

// Erros do PUT da revisão (ACO-104, regra A6). As frases da API servem só para
// reconhecer o caso; o texto exibido é nosso, de uma lista fechada.

const badRequestCases: Array<[RegExp, string]> = [
  [/comentário pode ter até/i, 'O comentário pode ter até 2000 caracteres.'],
  [/comentário tem caracteres invisíveis/i, 'O comentário tem caracteres invisíveis ou de controle. Apague-os e tente de novo.'],
  [/compartilhado com a paciente ou interno/i, 'Escolha se o comentário é compartilhado com a paciente ou interno.'],
  [/tag pode ter até/i, 'Cada tag pode ter até 32 caracteres.'],
  [/no máximo 10 tags/i, 'Use no máximo 10 tags por atividade.'],
  [/tags não podem ter caracteres/i, 'As tags não podem ter caracteres invisíveis, de controle ou quebra de linha.'],
]

export const REVIEW_CONFLICT_MESSAGE = 'A revisão mudou em outra aba ou dispositivo. Recarregue para ver a versão atual; o que você escreveu aqui continua na tela.'

export function isReviewVersionConflict(error: unknown): boolean {
  const { status, technical } = apiErrorInfo(error)
  return status === 409 && !!technical && /alterada em outra aba/i.test(technical)
}

export function reviewErrorMessage(error: unknown): string {
  const { status, technical } = apiErrorInfo(error)
  if (status === 400 && technical) {
    const known = badRequestCases.find(([pattern]) => pattern.test(technical))
    if (known) return known[1]
  }
  if (isReviewVersionConflict(error)) return REVIEW_CONFLICT_MESSAGE
  return apiErrorMessage(error, {
    400: 'Confira o comentário e as tags: algum passou do limite.',
    403: 'Só a psicóloga responsável pode revisar esta atividade.',
    404: 'Esta atividade ainda não tem uma resposta completa para revisar.',
    409: 'Esta atividade não está mais aguardando revisão. Recarregue a página.',
    default: 'Não foi possível salvar a revisão agora. Tente de novo.',
  })
}
