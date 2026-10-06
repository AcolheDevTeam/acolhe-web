// Estados da tela de confirmação de e-mail (ACO-63) e seus textos.
//
// Regra A6 (e lição do C8): cada status da API vira uma orientação distinta, e
// nunca afirmamos uma causa que a API não disse. 404 cobre link desconhecido,
// malformado ou substituído por um reenvio; 410 é vencido; o resto é falha
// nossa, com convite para tentar de novo.

export type VerifyEmailState = 'confirming' | 'confirmed' | 'invalid' | 'expired' | 'unavailable'

export interface VerifyEmailFeedback {
  state: VerifyEmailState
  title: string
  message: string
  /** O reenvio resolve link vencido ou substituído; falha nossa pede retry. */
  canResend: boolean
  canRetry: boolean
}

export function verifyEmailFeedback(status?: number): VerifyEmailFeedback {
  if (status === 404) {
    return {
      state: 'invalid',
      title: 'Este link não é mais válido',
      message: 'Se você pediu um novo link de confirmação, só o mais recente funciona. Confira o último e-mail que chegou ou peça um novo abaixo.',
      canResend: true,
      canRetry: false,
    }
  }
  if (status === 410) {
    return {
      state: 'expired',
      title: 'Este link venceu',
      message: 'Os links de confirmação valem por 24 horas. Peça um novo abaixo e use o e-mail mais recente.',
      canResend: true,
      canRetry: false,
    }
  }
  return {
    state: 'unavailable',
    title: 'Não foi possível confirmar agora',
    message: 'Tivemos um problema do nosso lado ao confirmar seu e-mail. O seu link continua valendo — tente novamente em instantes.',
    canResend: false,
    canRetry: true,
  }
}

export const verifyEmailConfirmed: VerifyEmailFeedback = {
  state: 'confirmed',
  title: 'E-mail confirmado',
  message: 'Seu cadastro está completo. Você já pode entrar e começar a usar o Acolhe.',
  canResend: false,
  canRetry: false,
}

// Mensagem única do reenvio: igual exista a conta ou não (anti-enumeração).
export const resendConfirmationMessage
  = 'Se este e-mail tiver um cadastro pendente, enviaremos um novo link em instantes. Confira também a caixa de spam.'
