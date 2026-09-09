import { idParamSchema } from '~/schemas/common'

export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  await apiFetch<void>(event, `/patients/${id}/export`, { method: 'POST' })
})
