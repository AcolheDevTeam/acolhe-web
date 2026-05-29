// Protege rotas autenticadas. Roda no servidor e no cliente.
export default defineNuxtRouteMiddleware(async () => {
  const { data: user } = await useFetch('/api/me')
  if (!user.value) return navigateTo('/login')
})
