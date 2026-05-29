// Proxy para a API Go — o token nunca chega ao cliente.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const config = useRuntimeConfig()
  const token = getCookie(event, 'acolhe_session')

  return await $fetch(`${config.apiUrl}/sessions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
})
