import { z } from 'zod'

// Cobrança (ACO-95; API: internal/billing). Planos e preços exibidos vêm de
// utils/plans.ts; aqui só o contrato com o BFF.
export const subscriptionStatusSchema = z.enum(['trialing', 'active', 'past_due', 'canceled'])
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>

export const planCodeSchema = z.enum(['autonomo', 'clinica', 'fundador'])
export const billingCycleSchema = z.enum(['monthly', 'annual'])

export const subscriptionSchema = z.object({
  status: subscriptionStatusSchema,
  planCode: planCodeSchema.nullable(),
  billingCycle: billingCycleSchema.nullable(),
  trialEndsAt: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  pastDueSince: z.string().nullable(),
  seats: z.number().int().nullable(),
  writable: z.boolean(),
})
export type Subscription = z.infer<typeof subscriptionSchema>

export const checkoutBodySchema = z.object({
  plan: planCodeSchema,
  cycle: billingCycleSchema,
}).strict()
export type CheckoutBody = z.infer<typeof checkoutBodySchema>

// Só aceitamos destinos do Stripe: a página manda o navegador para esta URL.
export const stripeRedirectSchema = z.object({
  url: z.string().url().refine((value) => {
    const host = new URL(value).hostname
    return new URL(value).protocol === 'https:' && (host === 'stripe.com' || host.endsWith('.stripe.com'))
  }, 'Endereço de pagamento inesperado.'),
})
export type StripeRedirect = z.infer<typeof stripeRedirectSchema>
