import { checkoutBodySchema, stripeRedirectSchema } from '~/schemas/billing'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => checkoutBodySchema.parse(value))
  return stripeRedirectSchema.parse(await apiFetch<unknown>(event, '/billing/checkout', { method: 'POST', body }))
})
