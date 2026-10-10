import { z } from 'zod'
import { patientSubmittedActivitySchema } from '~/schemas/patient-activity'

// Aba "Enviadas" (ACO-104). A paciente vem do token; a API só devolve o
// comentário compartilhado.
export default defineEventHandler(async (event) => {
  const response = await apiFetch<unknown>(event, '/patient/submitted-activities')
  return z.array(patientSubmittedActivitySchema).parse(response)
})
