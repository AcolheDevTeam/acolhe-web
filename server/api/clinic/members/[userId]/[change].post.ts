import { membershipChangeBodySchema, membershipChangeSchema } from '~/schemas/clinic'

export default defineEventHandler(async (event) => {
  const { userId, change } = await getValidatedRouterParams(event, value => membershipChangeSchema.parse(value))
  const body = await readValidatedBody(event, value => membershipChangeBodySchema.parse(value ?? {}))
  await apiFetch(event, `/clinic/members/${userId}/${change}`, { method: 'POST', body })
  setResponseStatus(event, 204)
  return null
})
