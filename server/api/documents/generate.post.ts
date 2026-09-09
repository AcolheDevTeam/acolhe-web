import { generateDocumentSchema } from '~/schemas/document'
import type { ClinicalDocument } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => generateDocumentSchema.parse(value))
  return await apiFetch<ClinicalDocument>(event, '/documents/generate', { method: 'POST', body })
})
