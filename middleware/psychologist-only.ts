import type { User } from '~/types'

// Restringe rotas clínicas a psicólogos.
export default defineNuxtRouteMiddleware(async () => {
  const { data: user } = await useFetch<User | null>('/api/me', { key: 'me' })
  if (user.value?.role !== 'psychologist') {
    return navigateTo('/dashboard')
  }
})
