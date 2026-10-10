import { portalBodySchema, stripeRedirectSchema } from '~/schemas/billing'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => portalBodySchema.parse(value ?? {}))
  return stripeRedirectSchema.parse(await apiFetch<unknown>(event, '/billing/portal', { method: 'POST', body }))
})
