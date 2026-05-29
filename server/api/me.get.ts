// Retorna o usuário logado. Roda só no servidor.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'acolhe_session')
  if (!token) return null

  try {
    return await $fetch(`${config.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    return null
  }
})
