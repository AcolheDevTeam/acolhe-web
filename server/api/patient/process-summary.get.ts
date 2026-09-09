import type { PatientProcessSummary } from '~/types'
import { patientProcessSummarySchema } from '~/schemas/patient'

export default defineEventHandler(async (event) => {
  const response = await apiFetch<PatientProcessSummary>(event, '/patient/process-summary')
  return patientProcessSummarySchema.parse(response)
})
