import { billingDetailsSchema } from '~/schemas/billing'

// Agenda o cancelamento para o fim do período pago.
export default defineEventHandler(async (event) => {
  return billingDetailsSchema.parse(await apiFetch<unknown>(event, '/billing/cancel', { method: 'POST' }))
})
