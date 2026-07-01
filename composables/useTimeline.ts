import type { TimelineEvent } from '~/types'

// Timeline do paciente — leitura pura, chave por paciente (LGPD). Consumida
// de forma lazy/island pela ACO-21.
export function usePatientTimeline(patientId: MaybeRefOrGetter<string>) {
  const id = toRef(patientId)
  return useFetch<TimelineEvent[]>(() => `/api/patients/${id.value}/timeline`, {
    key: () => `timeline-${id.value}`,
  })
}
