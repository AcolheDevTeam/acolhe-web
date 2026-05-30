// Timeline unificada do paciente (sessões + agendamentos + atividades) —
// proxy autenticado para a API Go. Leitura pura, exibida em componente lazy.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, 'acolhe_session')
  const patientId = getRouterParam(event, 'patientId')

  return await $fetch(`${config.apiUrl}/sessions/timeline/${patientId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
})
