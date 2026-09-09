import type { PatientCheckin } from '~/types'
import { patientCheckinsSchema } from '~/schemas/patient'

export default defineEventHandler(async (event) => {
  const response = await apiFetch<PatientCheckin[]>(event, '/patient/check-ins')
  return patientCheckinsSchema.parse(response)
})
