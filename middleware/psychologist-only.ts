import type { User } from '~/types'
import { patientRedirect } from '~/utils/patient-portal'

// Restringe rotas clínicas a psicólogos.
export default defineNuxtRouteMiddleware(async () => {
  const { data: user } = await useFetch<User | null>('/api/me', { key: 'me' })
  if (user.value?.role !== 'psychologist') return navigateTo(user.value?.role === 'patient' ? patientRedirect('patient') : '/login')
})
