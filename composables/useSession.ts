// Lógica reutilizável de sessões clínicas.
export function usePatientSessions(patientId: MaybeRefOrGetter<string>) {
  const id = toRef(patientId)
  return useFetch(() => `/api/sessions`, {
    query: { patient: id },
    key: () => `sessions-${id.value}`,
  })
}
