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
  /** Só em clínica: psicólogas ativas que contam como assento. */
  activePsychologists: z.number().int().nullable().optional(),
})
export type Subscription = z.infer<typeof subscriptionSchema>

export const checkoutBodySchema = z.object({
  plan: planCodeSchema,
  cycle: billingCycleSchema,
}).strict()
export type CheckoutBody = z.infer<typeof checkoutBodySchema>

export function isStripeUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'stripe.com' || url.hostname.endsWith('.stripe.com'))
  }
  catch {
    return false
  }
}

// Só aceitamos destinos do Stripe: a página manda o navegador para esta URL.
export const stripeRedirectSchema = z.object({
  url: z.string().url().refine(isStripeUrl, 'Endereço de pagamento inesperado.'),
})
export type StripeRedirect = z.infer<typeof stripeRedirectSchema>

/** `flow` leva o portal direto à troca de cartão. */
export const portalBodySchema = z.object({
  flow: z.literal('payment_method_update').optional(),
}).strict()
export type PortalBody = z.infer<typeof portalBodySchema>

export const invoiceStatusSchema = z.enum(['paid', 'open', 'uncollectible', 'void'])
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>

// Link de fatura fora do Stripe vira vazio: a página só abre endereços do Stripe.
const stripeLink = z.string().transform(value => (value && isStripeUrl(value) ? value : ''))

export const billingDetailsSchema = z.object({
  card: z.object({
    brand: z.string(),
    last4: z.string(),
    expMonth: z.number().int(),
    expYear: z.number().int(),
  }).nullable(),
  invoices: z.array(z.object({
    id: z.string(),
    number: z.string(),
    periodStart: z.string().nullable(),
    periodEnd: z.string().nullable(),
    amountCents: z.number().int(),
    status: invoiceStatusSchema,
    pdfUrl: stripeLink,
    hostedUrl: stripeLink,
  })),
  cancelAtPeriodEnd: z.boolean(),
  cancelAt: z.string().nullable(),
})
export type BillingDetails = z.infer<typeof billingDetailsSchema>
export type Invoice = BillingDetails['invoices'][number]
