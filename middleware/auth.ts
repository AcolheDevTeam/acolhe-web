import type { User } from '~/types'
import { authRedirect } from '~/utils/patient-portal'

// Protege rotas autenticadas. Roda no servidor e no cliente.
export default defineNuxtRouteMiddleware(async () => {
  const { data: user } = await useFetch<User | null>('/api/me', { key: 'me' })
  const redirect = authRedirect(user.value)
  if (redirect) return navigateTo(redirect)
})
