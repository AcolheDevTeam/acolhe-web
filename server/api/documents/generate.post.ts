import { generateDocumentSchema } from '~/schemas/document'
import type { ClinicalDocument } from '~/types'

// Pede a emissão: a API grava o documento e o worker gera o PDF (202, pending).
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => generateDocumentSchema.parse(value))
  return await apiFetch<ClinicalDocument>(event, '/documents/generate', { method: 'POST', body })
})
