import { toast } from 'vue-sonner'
import { logoutRedirect } from '~/utils/patient-portal'

export function useLogout() {
  const protection = useNuxtApp().$protectedLogout
  async function logout() {
    try {
      await protection.logout(
        async () => { await $fetch<{ ok: boolean }>('/api/logout', { method: 'POST' }) },
        async () => {
          clearNuxtData()
          await navigateTo(logoutRedirect(), { replace: true, external: true })
        },
      )
    } catch (error) {
      toast.error(apiErrorMessage(error, { default: 'Não foi possível sair agora. Tente novamente em instantes.' }))
    }
  }
  return { logout, isLoggingOut: protection.pending }
}
