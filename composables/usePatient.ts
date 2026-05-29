import type { Patient } from '~/types'

// Lógica reutilizável de pacientes. A chave inclui o contexto para evitar
// cache cruzado entre pacientes (crítico para LGPD).
export function usePatient(patientId: MaybeRefOrGetter<string>) {
  const id = toRef(patientId)
  return useFetch<Patient>(() => `/api/patients/${id.value}`, {
    key: () => `patient-${id.value}`,
  })
}
