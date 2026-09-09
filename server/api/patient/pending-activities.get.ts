import type { PatientPendingActivity } from '~/types'
import { patientPendingActivitySchema } from '~/schemas/patient'

export default defineEventHandler(async (event) => {
  const response = await apiFetch<PatientPendingActivity[]>(event, '/patient/pending-activities')
  return patientPendingActivitySchema.parse(response)
})
