import type { PatientPortalContext } from '~/types'
import { patientContextSchema } from '~/schemas/patient'

export default defineEventHandler(async (event) => {
  const response = await apiFetch<PatientPortalContext>(event, '/patient/context')
  return patientContextSchema.parse(response)
})
