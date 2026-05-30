// Respostas de uma atribuição de atividade — proxy autenticado para a API Go.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'acolhe_session')
  const id = getRouterParam(event, 'id')

  return await $fetch(`${config.apiUrl}/activities/assignments/${id}/responses`, {
    headers: { Authorization: `Bearer ${token}` },
  })
})
