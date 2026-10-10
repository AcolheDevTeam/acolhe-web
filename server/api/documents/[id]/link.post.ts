import { idParamSchema } from '~/schemas/common'
import type { ClinicalDocumentLink } from '~/types'

// Link de download novo (24 horas) a cada pedido. O PDF continua privado no
// armazenamento; só este link assinado dá acesso a ele.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  return await apiFetch<ClinicalDocumentLink>(event, `/documents/${id}/link`, { method: 'POST' })
})
