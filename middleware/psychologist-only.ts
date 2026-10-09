import type { User } from '~/types'
import { patientRedirect } from '~/utils/patient-portal'

// Restringe rotas clínicas a psicólogos.
export default defineNuxtRouteMiddleware(async () => {
  // O middleware auth revalida a sessão antes desta verificação de papel.
  const { data: user } = useNuxtData<User | null>('me')
  if (user.value?.role !== 'psychologist') {
    // Quem só administra a clínica não tem área clínica: vai à da clínica.
    if (user.value?.role === 'org_admin') return navigateTo(homeFor(user.value))
    return navigateTo(user.value?.role === 'patient' ? patientRedirect('patient') : '/login')
  }
})
