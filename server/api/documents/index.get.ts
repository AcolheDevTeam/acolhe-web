import { patientQuerySchema } from '~/schemas/common'
import type { ClinicalDocument } from '~/types'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => patientQuerySchema.parse(value))
  return await apiFetch<ClinicalDocument[]>(event, '/documents', { query })
})
