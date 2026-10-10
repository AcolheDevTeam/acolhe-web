import { documentsQuerySchema } from '~/schemas/document'
import type { ClinicalDocument } from '~/types'

// Documentos emitidos pela psicóloga logada, de todas as pacientes
// (?patientId= opcional) — proxy autenticado.
export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => documentsQuerySchema.parse(value))
  return await apiFetch<ClinicalDocument[]>(event, '/documents', { query })
})
