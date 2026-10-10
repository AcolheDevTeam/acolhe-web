import type { PatientRecordSession, PatientRecordSessionDetail } from '~/schemas/patient'
import { apiErrorMessage } from './api-error'
import { modalityLabel } from './format'
import { APP_TIMEZONE } from './timezone'

// Textos do "Meu prontuário" da paciente (ACO-88), no fuso de Brasília.

function yearOf(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { year: 'numeric', timeZone: APP_TIMEZONE }).format(date)
}

/** "9 de outubro"; o ano só aparece quando não é o ano corrente. */
export function historyDateLabel(value: string, now: Date = new Date()): string {
  const date = new Date(value)
  const sameYear = yearOf(date) === yearOf(now)
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: APP_TIMEZONE,
  }).format(date)
}

/** "Sessão 28 · Online", com "Sem anotações" quando a psicóloga não escreveu nada. */
export function historyListMeta(session: Pick<PatientRecordSession, 'number' | 'modality' | 'hasNotes'>): string {
  return [
    `Sessão ${session.number}`,
    session.modality ? modalityLabel(session.modality) : null,
    session.hasNotes ? null : 'Sem anotações',
  ].filter(Boolean).join(' · ')
}

/** "Online · 50 min"; vazio quando a API não informa nenhum dos dois. */
export function historyDetailMeta(session: Pick<PatientRecordSessionDetail, 'modality' | 'durationMinutes'>): string {
  return [
    session.modality ? modalityLabel(session.modality) : null,
    session.durationMinutes ? `${session.durationMinutes} min` : null,
  ].filter(Boolean).join(' · ')
}

/** "Versão 3 · atualizada em 9 out, 15h12". */
export function historyVersionLabel(session: Pick<PatientRecordSession, 'version' | 'updatedAt'>, now: Date = new Date()): string {
  const date = new Date(session.updatedAt)
  const sameYear = yearOf(date) === yearOf(now)
  const day = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: APP_TIMEZONE,
  }).format(date).replaceAll(' de ', ' ').replace('.', '')
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE }).format(date).replace(':', 'h')
  return `Versão ${session.version} · atualizada em ${day}, ${time}`
}

/** Mensagem de erro da lista (`list`) ou da leitura de uma sessão (`session`). */
export function patientHistoryErrorMessage(error: unknown, scope: 'list' | 'session'): string {
  return apiErrorMessage(error, {
    403: 'Esta área é só para pacientes.',
    404: scope === 'session' ? 'Sessão não encontrada.' : 'Não encontramos o seu histórico de sessões.',
    502: scope === 'session'
      ? 'O registro desta sessão chegou incompleto. Tente novamente em instantes.'
      : 'O seu histórico chegou incompleto. Tente novamente em instantes.',
    default: scope === 'session'
      ? 'Não foi possível abrir o registro desta sessão agora. Tente novamente.'
      : 'Não foi possível carregar o seu histórico agora. Tente novamente.',
  })
}
