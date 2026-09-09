import type { User } from '~/types'
import { patientRedirect } from '~/utils/patient-portal'

export default defineNuxtRouteMiddleware(async () => {
  const { data: user } = await useFetch<User | null>('/api/me', { key: 'me' })
  if (user.value?.role !== 'patient') return navigateTo(patientRedirect(user.value?.role))
})
