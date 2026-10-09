import { apiErrorInfo, apiErrorMessage } from './api-error'

// Mensagens da área da clínica por motivo (regra A6). O texto técnico da API
// só serve para reconhecer o caso.
const cases: Array<[number, RegExp, string]> = [
  [403, /responsável/i, 'Só a responsável pela clínica pode fazer isto.'],
  [403, /próprio vínculo/i, 'Você não pode alterar o seu próprio vínculo.'],
  [403, /não é uma clínica/i, 'Este espaço de trabalho não é uma clínica.'],
  [409, /responsável ativa/i, 'A clínica precisa de ao menos uma responsável ativa. Para transferir, fale com o suporte do Acolhe.'],
  [409, /estado atual/i, 'Esta mudança não é possível no estado atual do vínculo. Atualize a página.'],
  [409, /convite pendente/i, 'Já existe um convite pendente para este e-mail. Reenvie o convite na lista abaixo.'],
]

export function clinicErrorMessage(error: unknown, fallback = 'Não foi possível concluir a ação agora.'): string {
  const { status, technical } = apiErrorInfo(error)
  if (status && technical) {
    const known = cases.find(([code, pattern]) => code === status && pattern.test(technical))
    if (known) return known[2]
  }
  return apiErrorMessage(error, {
    400: 'Confira o e-mail e os papéis do convite.',
    403: 'Esta ação é restrita à administração da clínica.',
    404: 'Não encontramos este registro na clínica. Atualize a página.',
    default: fallback,
  })
}

export function membershipStatusLabel(status: string): string {
  return ({ active: 'Ativo', suspended: 'Suspenso', ended: 'Encerrado', invited: 'Convidado' } as Record<string, string>)[status] ?? status
}

export function deliveryMessage(status: 'sent' | 'failed' | 'disabled'): string {
  if (status === 'sent') return 'Convite enviado por e-mail. O link abaixo também funciona.'
  if (status === 'failed') return 'Não conseguimos enviar o e-mail. Copie o link abaixo e envie você mesma.'
  return 'O envio por e-mail não está configurado. Copie o link abaixo e envie você mesma.'
}
