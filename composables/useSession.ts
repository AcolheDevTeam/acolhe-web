// Lógica reutilizável de sessões clínicas.
// Tipos co-localizados aqui para espelhar a projeção pública da API Go
// (internal/session/types.go).

export interface Session {
  id: string
  patientId: string
  psychologistId: string
  occurredAt: string
  status: string
  createdAt: string
}

export interface TimelineItem {
  kind: 'session' | 'appointment' | 'activity'
  itemId: string
  occurredAt: string
  status: string
}

// Lista de sessões de um paciente. A chave inclui o paciente para evitar
// cache cruzado entre pacientes (crítico para LGPD).
export function usePatientSessions(patientId: MaybeRefOrGetter<string>) {
  const id = toRef(patientId)
  return useFetch<Session[]>(() => `/api/sessions`, {
    query: { patient: id },
    key: () => `sessions-${id.value}`,
  })
}

// Timeline unificada do paciente. Leitura pura — consumida por componente lazy.
export function usePatientTimeline(patientId: MaybeRefOrGetter<string>) {
  const id = toRef(patientId)
  return useFetch<TimelineItem[]>(() => `/api/sessions/timeline/${id.value}`, {
    key: () => `timeline-${id.value}`,
  })
}
