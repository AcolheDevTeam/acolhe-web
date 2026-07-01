import type { User } from '~/types'

// Retorna o usuário logado. Roda só no servidor (proxy autenticado).
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'acolhe_session')
  if (!token) return null

  try {
    return await apiFetch<User>(event, '/me')
  } catch {
    return null
  }
})
