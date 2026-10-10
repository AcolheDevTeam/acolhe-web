import type { PatientSelfExport, PatientSettings, PatientSettingsConsent } from '~/schemas/patient-settings'
import { apiErrorField, apiErrorMessage } from '~/utils/api-error'
import { APP_TIMEZONE } from '~/utils/timezone'

// Textos dos Ajustes da paciente (ACO-102), no fuso do app (o SSR roda em UTC).

export function settingsDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: APP_TIMEZONE }).format(new Date(value))
}

function settingsDateTime(value: string): string {
  const date = new Date(value)
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE }).format(date)
  return `${settingsDate(value)} às ${time}`
}

/** "Autorizado em 12/10/2025", "Revogado em 09/10/2026" ou "Não autorizado". */
export function consentStatusLabel(consent: PatientSettingsConsent): string {
  if (consent.status === 'accepted' && consent.acceptedAt) return `Autorizado em ${settingsDate(consent.acceptedAt)}`
  if (consent.status === 'revoked' && consent.revokedAt) return `Revogado em ${settingsDate(consent.revokedAt)}`
  return 'Não autorizado'
}

const relationshipLabels: Record<string, string> = {
  pending: 'Acompanhamento ainda não confirmado',
  paused: 'Acompanhamento pelo app pausado',
  ended: 'Acompanhamento encerrado',
  transferred: 'Acompanhamento encerrado',
}

/** "CRP 06/123456 · desde out/2025", com o estado quando o vínculo não está ativo. */
export function psychologistMeta(psychologist: NonNullable<PatientSettings['psychologist']>): string {
  const parts = [`CRP ${psychologist.crp}`]
  if (psychologist.since) {
    const month = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: APP_TIMEZONE }).format(new Date(psychologist.since)).replace('.', '')
    const year = new Intl.DateTimeFormat('pt-BR', { year: 'numeric', timeZone: APP_TIMEZONE }).format(new Date(psychologist.since))
    parts.push(`desde ${month}/${year}`)
  }
  const status = relationshipLabels[psychologist.relationshipStatus]
  if (status) parts.push(status)
  return parts.join(' · ')
}

export function initialsOf(name: string): string {
  return name.split(' ').map(part => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

/** Situação do pedido "Baixar meus dados", ou null quando não há pedido em aberto. */
export function selfExportNotice(exportRequest: PatientSelfExport | null): string | null {
  if (!exportRequest) return null
  if (exportRequest.status === 'failed') {
    return 'Não conseguimos preparar seus dados no último pedido. Peça de novo.'
  }
  if (!exportRequest.nextAvailableAt) return null
  const next = settingsDateTime(exportRequest.nextAvailableAt)
  if (exportRequest.status === 'sent') {
    return `Enviamos o link para o seu e-mail. Ele vale por 24 horas. Um novo pedido fica disponível em ${next}.`
  }
  return exportRequest.alreadyRequested
    ? `Você já pediu seus dados em ${settingsDateTime(exportRequest.requestedAt)}. O link chega por e-mail em até 24 horas.`
    : 'Pedido feito. O link chega por e-mail em até 24 horas.'
}

/** Banner do topo quando o consentimento de dados de saúde foi revogado. */
export function healthRevokedNotice(settings: PatientSettings | null): string | null {
  const health = settings?.consents.find(consent => consent.scope === 'health_data')
  if (health?.status !== 'revoked' || !health.revokedAt) return null
  return `Consentimento de dados de saúde revogado em ${settingsDate(health.revokedAt)}. O acompanhamento pelo app está pausado. Seus registros continuam guardados pelo prazo previsto em lei.`
}

export function consentErrorMessage(error: unknown, action: 'revoke' | 'accept'): string {
  return apiErrorMessage(error, {
    404: 'Este consentimento não está mais disponível. Atualize a página.',
    409: action === 'revoke'
      ? 'Este consentimento já estava revogado. A tela foi atualizada.'
      : 'Este consentimento já estava autorizado. A tela foi atualizada.',
    default: action === 'revoke'
      ? 'Não foi possível revogar o consentimento agora. Tente de novo em instantes.'
      : 'Não foi possível registrar a autorização agora. Tente de novo em instantes.',
  })
}

export function selfExportErrorMessage(error: unknown): string {
  return apiErrorMessage(error, {
    503: 'O pedido dos seus dados está indisponível agora. Tente de novo em alguns minutos.',
    default: 'Não foi possível pedir seus dados agora. Tente de novo em instantes.',
  })
}

export function profileErrorMessage(error: unknown): string {
  // O BFF aponta o campo (`data.field`); a API manda a mensagem curta do caso.
  const field = apiErrorField(error)
  const message = (error as { data?: { data?: { message?: string } } } | null)?.data?.data?.message ?? ''
  const phone = field === 'phone' || /telefone/i.test(message)
  return apiErrorMessage(error, {
    400: phone
      ? 'Informe um telefone válido, com DDD (de 8 a 15 dígitos).'
      : 'Informe seu nome completo, com 2 a 200 caracteres.',
    503: 'Não foi possível guardar o telefone agora. Tente de novo ou salve sem telefone.',
    default: 'Não foi possível salvar seus dados agora. Tente de novo em instantes.',
  })
}
