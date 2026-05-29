// Restringe rotas clínicas a psicólogos.
export default defineNuxtRouteMiddleware(async () => {
  const { data: user } = await useFetch('/api/me')
  if (user.value?.role !== 'psychologist') {
    return navigateTo('/dashboard')
  }
})
