import { stripeRedirectSchema } from '~/schemas/billing'

export default defineEventHandler(async (event) => {
  return stripeRedirectSchema.parse(await apiFetch<unknown>(event, '/billing/portal', { method: 'POST' }))
})
