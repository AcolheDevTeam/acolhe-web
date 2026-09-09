import type { PatientNextSession } from '~/types'
import { patientNextSessionSchema } from '~/schemas/patient'

export default defineEventHandler(async (event) => {
  const response = await apiFetch<PatientNextSession | null>(event, '/patient/next-session')
  return patientNextSessionSchema.parse(response)
})
