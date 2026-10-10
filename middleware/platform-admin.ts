import type { User } from '~/types'

export default defineNuxtRouteMiddleware(() => {
  const { data: user } = useNuxtData<User | null>('me')
  if (user.value?.role !== 'platform_admin') return navigateTo(homeFor(user.value))
})
