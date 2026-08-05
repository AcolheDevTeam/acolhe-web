import type { Session } from '~/types'

// Lógica reutilizável de sessões clínicas. A chave inclui o paciente para
// evitar cache cruzado entre pacientes (crítico para LGPD).
export function usePatientSessions(patientId: MaybeRefOrGetter<string>) {
  const id = toRef(patientId)
  return useFetch<Session[]>('/api/sessions', {
    query: { patientId: id },
    key: () => `sessions-${id.value}`,
  })
}

export function useSession(sessionId: MaybeRefOrGetter<string>) {
  const id = toRef(sessionId)
  return useFetch<Session>(() => `/api/sessions/${id.value}`, {
    key: () => `session-${id.value}`,
  })
}

// Agenda geral (ex.: dashboard) — sem filtro de paciente.
export function useSessions(query?: MaybeRefOrGetter<Record<string, unknown>>) {
  return useFetch<Session[]>('/api/sessions', {
    query: query ? toRef(query) : undefined,
    key: () => query ? `sessions-${JSON.stringify(toValue(query))}` : 'sessions-all',
  })
}
