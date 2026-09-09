import type { InvitationDeliveryStatus } from '~/types'

// Textos e comportamento da UI para o resultado do envio do convite. Fonte
// única, auto-importada pelo Nuxt. A UI nunca afirma que o e-mail saiu quando a
// API disse o contrário, e só destaca o link quando ele é o caminho principal.
export interface InvitationDeliveryMeta {
  /** Título da tela de sucesso do diálogo de novo paciente. */
  title: string
  /** Explicação do próximo passo. */
  description: (patientName: string, email?: string) => string
  /** Mensagem curta para o toast após criar ou reenviar. */
  toast: string
  /** Frase curta para acompanhar o resultado na ficha do paciente. */
  short: string
  /** Se o link deve aparecer em destaque (fallback manual) ou só como ação secundária. */
  showLink: boolean
  tone: 'default' | 'warning'
}

export function invitationDeliveryMeta(status?: InvitationDeliveryStatus | string): InvitationDeliveryMeta {
  switch (status) {
    case 'sent':
      return {
        title: 'Convite enviado',
        description: (patientName, email) =>
          `${patientName} vai receber um e-mail em ${email ?? 'o endereço cadastrado'} com o link para ler o consentimento e criar a senha. O convite vale por 7 dias.`,
        toast: 'Convite enviado por e-mail.',
        short: 'E-mail enviado.',
        showLink: false,
        tone: 'default',
      }
    case 'failed':
      return {
        title: 'Convite criado, mas o e-mail não saiu',
        description: (_patientName, email) =>
          `Não conseguimos enviar o e-mail para ${email ?? 'o endereço cadastrado'}. Copie o link abaixo e envie por outro canal, ou gere um novo convite mais tarde pela ficha do paciente.`,
        toast: 'Convite criado, mas o e-mail não foi enviado.',
        short: 'O e-mail não foi enviado.',
        showLink: true,
        tone: 'warning',
      }
    default:
      return {
        title: 'Convite pronto',
        description: (patientName, email) =>
          `Envie este link manualmente para ${email ?? 'o endereço cadastrado'}. ${patientName} ficará em onboarding até aceitar o consentimento e criar a conta.`,
        toast: 'Convite pronto para compartilhar.',
        short: 'Envio por e-mail indisponível neste ambiente.',
        showLink: true,
        tone: 'default',
      }
  }
}
