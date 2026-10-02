import type { User } from '~/types'
import { patientRedirect } from '~/utils/patient-portal'

// Restringe rotas clínicas a psicólogos.
export default defineNuxtRouteMiddleware(async () => {
  // O middleware auth revalida a sessão antes desta verificação de papel.
  const { data: user } = useNuxtData<User | null>('me')
  if (user.value?.role !== 'psychologist') return navigateTo(user.value?.role === 'patient' ? patientRedirect('patient') : '/login')
})
