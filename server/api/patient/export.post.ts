import { patientSelfExportSchema } from '~/schemas/patient-settings'

// "Baixar meus dados": a API identifica a paciente pelo token; nada do corpo
// segue adiante.
export default defineEventHandler(async (event) => {
  const response = await apiFetch<unknown>(event, '/patient/export', { method: 'POST' })
  return patientSelfExportSchema.parse(response)
})
