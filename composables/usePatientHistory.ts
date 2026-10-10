import type { PatientRecordSession, PatientRecordSessionDetail } from '~/schemas/patient'
import type { User } from '~/types'
import { sessionExpired } from '~/utils/patient-portal'

// "Meu prontuário" da paciente (ACO-88). Fica fora do usePatientPortal: o resto
// do portal exige vínculo ativo, e esta leitura continua com ele encerrado.
// A chave de cache leva o usuário (e a sessão), para não cruzar dados.

function usePatientHistoryKey() {
  const { data: me } = useFetch<User | null>('/api/me', { key: 'me' })
  return () => `patient-history-${me.value?.id ?? 'pending'}`
}

function redirectOnExpired(error: Ref<unknown>) {
  watch(error, (value) => {
    if (import.meta.client && sessionExpired(value as { statusCode?: number } | null)) navigateTo('/login')
  })
}

export function usePatientHistory() {
  const key = usePatientHistoryKey()
  const request = useFetch<PatientRecordSession[]>('/api/patient/record/sessions', {
    key: () => `${key()}-sessions`,
    default: () => [],
  })
  redirectOnExpired(request.error)
  return request
}

export function usePatientHistorySession(sessionId: MaybeRefOrGetter<string>) {
  const key = usePatientHistoryKey()
  const request = useFetch<PatientRecordSessionDetail | null>(() => `/api/patient/record/sessions/${encodeURIComponent(toValue(sessionId))}`, {
    key: () => `${key()}-session-${toValue(sessionId)}`,
    default: () => null,
  })
  redirectOnExpired(request.error)
  return request
}
