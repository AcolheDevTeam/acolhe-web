import type { User } from '~/types'

export default defineNuxtRouteMiddleware(async () => {
  const { data: user } = await useFetch<User | null>('/api/me', { key: 'me' })
  if (user.value?.role !== 'patient') {
    return navigateTo(user.value ? '/dashboard' : '/login')
  }
})
