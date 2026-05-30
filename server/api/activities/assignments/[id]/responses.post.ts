// Submete uma resposta a uma atribuição — proxy autenticado para a API Go.
// A API Go não recebe corpo: cria o registro de resposta para a atribuição.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'acolhe_session')
  const id = getRouterParam(event, 'id')

  return await $fetch(`${config.apiUrl}/activities/assignments/${id}/responses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
})
