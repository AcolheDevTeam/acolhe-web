import { billingDetailsSchema } from '~/schemas/billing'

// Cartão, faturas e cancelamento agendado (lidos do Stripe pela API).
export default defineEventHandler(async (event) => {
  return billingDetailsSchema.parse(await apiFetch<unknown>(event, '/billing/details'))
})
