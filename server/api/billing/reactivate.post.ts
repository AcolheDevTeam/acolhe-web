import { billingDetailsSchema } from '~/schemas/billing'

// Desfaz o cancelamento agendado.
export default defineEventHandler(async (event) => {
  return billingDetailsSchema.parse(await apiFetch<unknown>(event, '/billing/reactivate', { method: 'POST' }))
})
