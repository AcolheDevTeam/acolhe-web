import { idParamSchema } from '~/schemas/common'
import type { ClinicalDocument } from '~/types'

// Um documento (usado para acompanhar a geração do PDF).
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  return await apiFetch<ClinicalDocument>(event, `/documents/${id}`)
})
