import type {
  PatientCheckin,
  PatientNextSession,
  PatientPendingActivity,
  PatientPortalContext,
  PatientProcessSummary,
  User,
} from '~/types'
import { patientPortalCacheKey } from '~/utils/patient-portal'

export function usePatientPortal() {
  const { data: me } = useFetch<User | null>('/api/me', { key: 'me' })
  const patientId = computed(() => me.value?.patient?.id ?? null)
  const cacheKey = () => patientPortalCacheKey(patientId.value)

  const context = useFetch<PatientPortalContext>('/api/patient/context', {
    key: () => `${cacheKey()}-context`,
    default: () => null,
    immediate: false,
    watch: false,
  })
  const nextSession = useFetch<PatientNextSession | null>('/api/patient/next-session', {
    key: () => `${cacheKey()}-next-session`,
    default: () => null,
    immediate: false,
    watch: false,
  })
  const activities = useFetch<PatientPendingActivity[]>('/api/patient/pending-activities', {
    key: () => `${cacheKey()}-activities`,
    default: () => [],
    immediate: false,
    watch: false,
  })
  const checkins = useFetch<PatientCheckin[]>('/api/patient/check-ins', {
    key: () => `${cacheKey()}-check-ins`,
    default: () => [],
    immediate: false,
    watch: false,
  })
  const summary = useFetch<PatientProcessSummary>('/api/patient/process-summary', {
    key: () => `${cacheKey()}-summary`,
    default: () => ({ sessionCount: 0, pendingActivityCount: 0, checkinCount: 0 }),
    immediate: false,
    watch: false,
  })

  const requests = [context, nextSession, activities, checkins, summary]
  const fetchedPatientId = ref<string | null>(null)
  watch(patientId, (id) => {
    if (!id || id === fetchedPatientId.value) return
    fetchedPatientId.value = id
    void Promise.all(requests.map(request => request.execute()))
  }, { immediate: true })

  const pending = computed(() => requests.some(request => request.pending.value))
  const error = computed(() => requests.find(request => request.error.value)?.error.value ?? null)

  return { me, context, nextSession, activities, checkins, summary, pending, error }
}
