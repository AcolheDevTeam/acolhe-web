// Lista de pacientes — proxy autenticado para a API Go.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'acolhe_session')

  return await $fetch(`${config.apiUrl}/patients`, {
    headers: { Authorization: `Bearer ${token}` },
  })
})
