import type { PatientContext } from '~/types'

// Paciente sem vínculo ativo (ACO-88): o /me responde, mas o portal só mostra
// o Histórico e os Ajustes. Devolve o motivo para a tela, ou null quando o
// vínculo está ok.
export function inactiveLinkReason(patient?: Pick<PatientContext, 'relationshipStatus' | 'consented'> | null): string | null {
  if (!patient) return null
  if (patient.relationshipStatus === 'active' && patient.consented) return null
  switch (patient.relationshipStatus) {
    case 'ended':
    case 'transferred':
      return 'Seu acompanhamento com a psicóloga foi encerrado.'
    case 'paused':
      // Hoje o vínculo só pausa quando a paciente revoga o consentimento de
      // dados de saúde em Ajustes (ACO-102).
      return patient.consented
        ? 'Seu acompanhamento com a psicóloga está pausado.'
        : 'Seu acompanhamento pelo app está pausado porque o consentimento de dados de saúde foi revogado.'
    default:
      return 'Seu acompanhamento com a psicóloga ainda não foi confirmado.'
  }
}

/** Páginas que continuam abertas sem vínculo ativo. */
export function openWithoutLink(path: string): boolean {
  return ['/patient/historico', '/patient/ajustes'].some(base => path === base || path.startsWith(`${base}/`))
}
