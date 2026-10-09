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
export function usePatientCheckins(patientId: MaybeRefOrGetter<string>) {
  const id = toRef(patientId)
  return useFetch<PatientCheckin[]>(() => `/api/patients/${id.value}/checkins`, {
    key: () => `patient-checkins-${id.value}`,
    default: () => [],
  })
}
