import type { Patient, PatientCheckin } from '~/types'

// Lógica reutilizável de pacientes. A chave inclui o contexto para evitar
// cache cruzado entre pacientes (crítico para LGPD).
export function usePatient(patientId: MaybeRefOrGetter<string>) {
  const id = toRef(patientId)
  return useFetch<Patient>(() => `/api/patients/${id.value}`, {
    key: () => `patient-${id.value}`,
  })
}

// Check-ins da paciente vistos pela psicóloga (aba Check-ins e humor da visão geral).
// `enabled` falso não faz nenhuma requisição, nem no SSR nem ao trocar de paciente:
// dado clínico só sai da API com vínculo e consentimento ativos (LGPD).
export function usePatientCheckins(patientId: MaybeRefOrGetter<string>, enabled: MaybeRefOrGetter<boolean> = true) {
  const id = toRef(patientId)
  const requestFetch = useRequestFetch()
  return useAsyncData<PatientCheckin[]>(
    () => `patient-checkins-${id.value}`,
    () => toValue(enabled)
      ? requestFetch<PatientCheckin[]>(`/api/patients/${id.value}/checkins`)
      : Promise.resolve([]),
    {
      default: () => [],
      immediate: toValue(enabled),
      watch: [() => toValue(enabled)],
    },
  )
}
