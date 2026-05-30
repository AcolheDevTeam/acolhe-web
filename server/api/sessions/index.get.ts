// Lista de sessões de um paciente — proxy autenticado para a API Go.
// O cliente chama com ?patient=<id>; a API Go espera ?patientId=<id>.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'acolhe_session')
  const { patient } = getQuery(event)

  return await $fetch(`${config.apiUrl}/sessions`, {
    query: { patientId: patient },
    headers: { Authorization: `Bearer ${token}` },
  })
})
