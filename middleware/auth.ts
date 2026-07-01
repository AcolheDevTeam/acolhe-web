import type { User } from '~/types'

// Protege rotas autenticadas. Roda no servidor e no cliente.
export default defineNuxtRouteMiddleware(async () => {
  const { data: user } = await useFetch<User | null>('/api/me', { key: 'me' })
  if (!user.value) return navigateTo('/login')
})
