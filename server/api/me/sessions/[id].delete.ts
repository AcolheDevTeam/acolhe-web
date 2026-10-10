import { idParamSchema } from '~/schemas/common'

// Encerra a sessão de outro aparelho.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  await apiFetch(event, `/me/sessions/${id}`, { method: 'DELETE' })
  setResponseStatus(event, 204)
  return null
})
