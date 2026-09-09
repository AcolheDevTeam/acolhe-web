import type { InvitationDeliveryStatus } from '~/types'

// Textos únicos para o resultado do envio do convite (auto-importado pelo Nuxt).
// A UI nunca afirma que o e-mail saiu quando a API disse o contrário.
export interface InvitationDeliveryMeta {
  /** Mensagem curta para o toast após criar ou reenviar. */
  toast: string
  /** Frase curta para acompanhar o link na ficha do paciente. */
  short: string
  /** Explicação completa para o passo seguinte no diálogo de novo paciente. */
  detail: (email?: string) => string
  tone: 'default' | 'warning'
}

export function invitationDeliveryMeta(status?: InvitationDeliveryStatus | string): InvitationDeliveryMeta {
  switch (status) {
    case 'sent':
      return {
        toast: 'Convite enviado por e-mail.',
        short: 'E-mail enviado.',
        detail: email => `Enviamos o convite para ${email ?? 'o e-mail cadastrado'}. Se preferir, copie o link abaixo e envie por outro canal.`,
        tone: 'default',
      }
    case 'failed':
      return {
        toast: 'Convite criado, mas o e-mail não foi enviado.',
        short: 'O e-mail não foi enviado.',
        detail: email => `Não conseguimos enviar o e-mail para ${email ?? 'o endereço cadastrado'}. Copie o link abaixo e envie por outro canal, ou gere um novo convite mais tarde.`,
        tone: 'warning',
      }
    default:
      return {
        toast: 'Convite pronto para compartilhar.',
        short: 'Envio por e-mail indisponível neste ambiente.',
        detail: email => `Envie este link manualmente para ${email ?? 'o e-mail cadastrado'}.`,
        tone: 'default',
      }
  }
}
