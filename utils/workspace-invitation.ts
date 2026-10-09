import { apiErrorInfo, apiErrorMessage } from './api-error'

// Texto por motivo do convite (regra A6). A API usa 409 para casos diferentes;
// o texto técnico dela só serve para reconhecer qual é o caso.
const conflictCases: Array<[RegExp, string]> = [
  [/paciente/i, 'Este e-mail já é usado por uma conta de paciente. Para atuar como profissional, peça à clínica um convite para outro e-mail.'],
  [/já faz parte/i, 'Você já faz parte deste espaço de trabalho. Entre normalmente pelo login.'],
  [/CRP/i, 'Este CRP já está cadastrado em outra conta. Fale com o suporte do Acolhe.'],
  [/acabou de ser cadastrado/i, 'Este e-mail acabou de ser cadastrado. Recarregue a página para entrar com a conta.'],
]

export function invitationErrorMessage(error: unknown, context: 'preview' | 'accept' = 'accept'): string {
  const { status, technical } = apiErrorInfo(error)
  // Na prévia, 400 é token fora do formato: link cortado pelo cliente de e-mail.
  if (context === 'preview' && status === 400) return 'Convite não encontrado. Confira se o link está completo.'
  if (status === 409 && technical) {
    const known = conflictCases.find(([pattern]) => pattern.test(technical))
    if (known) return known[1]
  }
  return apiErrorMessage(error, {
    400: 'Confira os dados do formulário.',
    401: 'Senha incorreta.',
    404: 'Convite não encontrado. Confira se o link está completo.',
    409: 'Não foi possível aceitar este convite. Fale com a clínica.',
    410: 'Este convite expirou, foi cancelado ou já foi usado. Peça um novo à clínica.',
    default: 'Não foi possível aceitar o convite agora. Tente novamente em instantes.',
  })
}
