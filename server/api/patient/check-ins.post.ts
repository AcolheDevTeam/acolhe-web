import type { PatientCheckin } from '~/types'
import { patientCheckinInputSchema, patientCheckinSchema } from '~/schemas/patient'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => patientCheckinInputSchema.parse(value))
  const response = await apiFetch<PatientCheckin>(event, '/patient/check-ins', { method: 'POST', body })
  return patientCheckinSchema.parse(response)
})
