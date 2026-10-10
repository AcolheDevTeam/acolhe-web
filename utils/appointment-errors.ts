import { apiErrorInfo } from './api-error'

// Mensagens específicas para os 409 da agenda (regra A6). A API usa 409 para
// casos diferentes; o texto técnico dela só serve para reconhecer qual é o caso,
// nunca é exibido.

const conflictCases: Array<[RegExp, string]> = [
  [/evolução registrada/i, 'Este atendimento já tem evolução no prontuário, então não pode ser cancelado, marcado como falta nem reagendado.'],
  [/ainda não aconteceu/i, 'O atendimento ainda não aconteceu. Só é possível concluí-lo ou registrar falta depois do horário marcado.'],
  [/conflito de horário/i, 'Já existe outra sessão neste horário. Escolha outro horário.'],
]

/** Texto do 409 da agenda; `null` quando o erro não é 409 ou não é um caso conhecido. */
export function appointmentConflictMessage(error: unknown): string | null {
  const { status, technical } = apiErrorInfo(error)
  if (status !== 409 || !technical) return null
  return conflictCases.find(([pattern]) => pattern.test(technical))?.[1] ?? null
}

export type FinalAppointmentStatus = 'completed' | 'no_show' | 'canceled'

/** Textos da confirmação das ações sem volta do agendamento. */
export const finalStatusConfirmation: Record<FinalAppointmentStatus, { title: string, description: string, confirmLabel: string, destructive: boolean }> = {
  completed: {
    title: 'Marcar como realizada?',
    description: 'O atendimento passa a constar como realizado no prontuário. Esta ação não pode ser desfeita.',
    confirmLabel: 'Marcar como realizada',
    destructive: false,
  },
  no_show: {
    title: 'Registrar falta?',
    description: 'O atendimento fica registrado como falta do(a) paciente. Esta ação não pode ser desfeita.',
    confirmLabel: 'Registrar falta',
    destructive: true,
  },
  canceled: {
    title: 'Cancelar esta sessão?',
    description: 'O agendamento será cancelado e o horário volta a ficar livre na agenda. Esta ação não pode ser desfeita.',
    confirmLabel: 'Cancelar sessão',
    destructive: true,
  },
}
