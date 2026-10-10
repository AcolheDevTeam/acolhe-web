import type { PatientContext } from '~/types'

// Paciente sem vínculo ativo (ACO-88): o /me responde, mas o portal só mostra
// o Histórico. Devolve o motivo para a tela, ou null quando o vínculo está ok.
export function inactiveLinkReason(patient?: Pick<PatientContext, 'relationshipStatus' | 'consented'> | null): string | null {
  if (!patient) return null
  if (patient.relationshipStatus === 'active' && patient.consented) return null
  switch (patient.relationshipStatus) {
    case 'ended':
    case 'transferred':
      return 'Seu acompanhamento com a psicóloga foi encerrado.'
    case 'paused':
      return 'Seu acompanhamento com a psicóloga está pausado.'
    default:
      return 'Seu acompanhamento com a psicóloga ainda não foi confirmado.'
  }
}

/** Páginas que continuam abertas sem vínculo ativo. */
export function openWithoutLink(path: string): boolean {
  return path === '/patient/historico' || path.startsWith('/patient/historico/')
}
