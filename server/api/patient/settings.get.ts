import { patientSettingsSchema } from '~/schemas/patient-settings'

// Ajustes da paciente (ACO-102). Abre com o vínculo em qualquer estado.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const response = await apiFetch<unknown>(event, '/patient/settings')
  return patientSettingsSchema.parse(response)
})
