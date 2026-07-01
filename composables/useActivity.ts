import type { Activity } from '~/types'

// Atividades de um paciente — chave por paciente para não misturar dados (LGPD).
export function usePatientActivities(patientId: MaybeRefOrGetter<string>) {
  const id = toRef(patientId)
  return useFetch<Activity[]>('/api/activities', {
    query: { patient: id },
    key: () => `activities-${id.value}`,
  })
}

export function useActivity(activityId: MaybeRefOrGetter<string>) {
  const id = toRef(activityId)
  return useFetch<Activity>(() => `/api/activities/${id.value}`, {
    key: () => `activity-${id.value}`,
  })
}

// Fila geral de atividades (ex.: aguardando revisão no dashboard).
export function useActivities(query?: MaybeRefOrGetter<Record<string, unknown>>) {
  return useFetch<Activity[]>('/api/activities', {
    query: query ? toRef(query) : undefined,
    key: 'activities-all',
  })
}
