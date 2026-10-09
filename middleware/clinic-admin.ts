import type { User } from '~/types'

// Área da clínica: só quem tem clinic_owner ou clinic_admin no vínculo ativo
// (papel do vínculo, não o efetivo: a dona que atende também administra).
export default defineNuxtRouteMiddleware(() => {
  const { data: user } = useNuxtData<User | null>('me')
  if (!isClinicAdmin(user.value)) return navigateTo(homeFor(user.value))
})
