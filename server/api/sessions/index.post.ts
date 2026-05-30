// Cria uma sessão clínica — proxy autenticado para a API Go.
// A API Go deriva o psicólogo do token; o corpo carrega apenas { patientId, occurredAt }.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'acolhe_session')
  const body = await readBody(event)

  return await $fetch(`${config.apiUrl}/sessions`, {
    method: 'POST',
    body,
    headers: { Authorization: `Bearer ${token}` },
  })
})
