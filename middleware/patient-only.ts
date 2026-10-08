import type { User } from '~/types'
import { patientRedirect } from '~/utils/patient-portal'

export default defineNuxtRouteMiddleware(async () => {
  // O middleware auth revalida a sessão antes desta verificação de papel.
  const { data: user } = useNuxtData<User | null>('me')
  if (user.value?.role !== 'patient') return navigateTo(patientRedirect(user.value?.role))
})
