import type {
  PatientCheckin,
  PatientNextSession,
  PatientPendingActivity,
  PatientPortalContext,
  PatientProcessSummary,
  User,
} from '~/types'

export function usePatientPortal() {
  const { data: me } = useFetch<User | null>('/api/me', { key: 'me' })
  const cacheKey = () => `patient-portal-${me.value?.patient?.id ?? 'anonymous'}`

  const context = useFetch<PatientPortalContext>('/api/patient/context', {
    key: () => `${cacheKey()}-context`,
    default: () => null,
  })
  const nextSession = useFetch<PatientNextSession | null>('/api/patient/next-session', {
    key: () => `${cacheKey()}-next-session`,
    default: () => null,
  })
  const activities = useFetch<PatientPendingActivity[]>('/api/patient/pending-activities', {
    key: () => `${cacheKey()}-activities`,
    default: () => [],
  })
  const checkins = useFetch<PatientCheckin[]>('/api/patient/check-ins', {
    key: () => `${cacheKey()}-check-ins`,
    default: () => [],
  })
  const summary = useFetch<PatientProcessSummary>('/api/patient/process-summary', {
    key: () => `${cacheKey()}-summary`,
    default: () => ({ sessionCount: 0, pendingActivityCount: 0, checkinCount: 0 }),
  })

  const requests = [context, nextSession, activities, checkins, summary]
  const pending = computed(() => requests.some(request => request.pending.value))
  const error = computed(() => requests.find(request => request.error.value)?.error.value ?? null)

  return { me, context, nextSession, activities, checkins, summary, pending, error }
}
