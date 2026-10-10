import type { PatientSettings } from '~/schemas/patient-settings'
import type { User } from '~/types'
import { sessionExpired } from '~/utils/patient-portal'

// Ajustes da paciente (ACO-102). Fora do usePatientPortal: abre com o vínculo
// em qualquer estado. A chave de cache leva o usuário, para não cruzar dados.
export function usePatientSettings() {
  const { data: me } = useFetch<User | null>('/api/me', { key: 'me' })
  const request = useFetch<PatientSettings | null>('/api/patient/settings', {
    key: () => `patient-settings-${me.value?.id ?? 'pending'}`,
    default: () => null,
  })
  watch(request.error, (value) => {
    if (import.meta.client && sessionExpired(value as { statusCode?: number } | null)) navigateTo('/login')
  })
  return request
}
