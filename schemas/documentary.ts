import { z } from 'zod'
export const documentaryCategories = [
  { value: 'hypothesis', label: 'Hipótese' },
  { value: 'technical_observation', label: 'Observação técnica' },
  { value: 'planning', label: 'Planejamento' },
  { value: 'transcription', label: 'Transcrição' },
  { value: 'other', label: 'Outras' },
] as const
export const categorySchema = z.enum([
  'hypothesis',
  'technical_observation',
  'planning',
  'transcription',
  'other',
])
export type DocumentaryCategory = z.infer<typeof categorySchema>
export const documentaryContentSchema = z
  .string()
  .refine(
    (value) => new TextEncoder().encode(value).length <= 200000,
    'O texto deve ter no máximo 200.000 bytes.',
  )
export const saveNotebookSchema = z
  .object({
    content: documentaryContentSchema,
    expectedRevision: z.number().int().min(0),
  })
  .strict()
export const restoreNotebookSchema = z
  .object({
    revision: z.number().int().positive(),
    expectedRevision: z.number().int().min(1),
  })
  .strict()
export const documentaryPatientSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  writable: z.boolean(),
})
export const notebookSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  category: categorySchema,
  content: documentaryContentSchema,
  revision: z.number().int().positive(),
  updatedAt: z.string().datetime({ offset: true }),
})
export const notebooksSchema = z.object({
  patient: documentaryPatientSchema,
  items: z.array(notebookSchema),
})
export const versionSummarySchema = z.object({
  id: z.string().uuid(),
  revision: z.number().int().positive(),
  createdAt: z.string().datetime({ offset: true }),
  restoredFrom: z.number().int().positive().nullable(),
})
export const versionSchema = versionSummarySchema.extend({
  content: documentaryContentSchema,
})
export const documentaryPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
const totals = {
  totalCount: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
}
export const documentaryPatientsSchema = z.object({
  items: z.array(documentaryPatientSchema),
  ...totals,
})
export const documentaryHistorySchema = z.object({
  items: z.array(versionSummarySchema),
  ...totals,
})
export type Notebook = z.infer<typeof notebookSchema>
export type NotebookVersion = z.infer<typeof versionSchema>
export type DocumentaryHistory = z.infer<typeof documentaryHistorySchema>

// Saída de clínica (ACO-96): prazo de 30 dias para baixar os próprios cadernos.
export const departureSchema = z.object({
  organizationId: z.string().uuid(),
  organizationName: z.string(),
  endedAt: z.string(),
  exportUntil: z.string(),
  notebooks: z.number().int().nonnegative(),
})
export const departuresSchema = z.array(departureSchema)
export type Departure = z.infer<typeof departureSchema>
