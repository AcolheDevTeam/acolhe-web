import { describe, expect, it } from 'vitest'
import { billingDetailsSchema, checkoutBodySchema, portalBodySchema, stripeRedirectSchema, subscriptionSchema } from '~/schemas/billing'
import { apiErrorMessage, READ_ONLY_MESSAGE } from '~/utils/api-error'
import {
  billedSeats,
  cardExpiry,
  invoicePeriodLabel,
  invoiceStatusMeta,
  longCalendarDate,
  longDate,
  billingErrorMessage,
  canManageBilling,
  cycleFor,
  hasBilling,
  pastDueDeadline,
  plansForWorkspace,
  planTotals,
  subscriptionKey,
  trialBannerText,
  trialDaysLeft,
} from '~/utils/billing'
import { planByCode } from '~/utils/plans'

const trial = {
  status: 'trialing' as const,
  planCode: null,
  billingCycle: null,
  trialEndsAt: '2026-10-12T15:00:00Z',
  currentPeriodEnd: null,
  pastDueSince: null,
  seats: null,
  writable: true,
}

describe('dias de teste no fuso de São Paulo', () => {
  it('conta dias de calendário, não 24 h', () => {
    // 9/10 23:30 em SP (10/10 02:30 UTC) até 12/10 12:00 em SP: 3 dias.
    expect(trialDaysLeft('2026-10-12T15:00:00Z', '2026-10-10T02:30:00Z')).toBe(3)
    expect(trialDaysLeft('2026-10-12T15:00:00Z', '2026-10-12T03:30:00Z')).toBe(0)
    expect(trialDaysLeft('2026-10-12T15:00:00Z', '2026-10-13T12:00:00Z')).toBe(-1)
  })

  it('o fim às 01:00 UTC ainda é o dia anterior em São Paulo', () => {
    expect(trialDaysLeft('2026-10-13T01:00:00Z', '2026-10-11T12:00:00Z')).toBe(1)
  })

  it('aviso só nos últimos 3 dias e com escrita liberada', () => {
    expect(trialBannerText(trial, '2026-10-08T12:00:00Z')).toBeNull()
    expect(trialBannerText(trial, '2026-10-09T12:00:00Z')).toBe('Seu teste termina em 3 dias')
    expect(trialBannerText(trial, '2026-10-11T12:00:00Z')).toBe('Seu teste termina em 1 dia')
    expect(trialBannerText(trial, '2026-10-12T12:00:00Z')).toBe('Seu teste termina hoje')
    expect(trialBannerText({ ...trial, writable: false }, '2026-10-12T12:00:00Z')).toBeNull()
    expect(trialBannerText({ ...trial, status: 'active' }, '2026-10-12T12:00:00Z')).toBeNull()
  })

  it('prazo do atraso: 7 dias depois do primeiro dia em atraso', () => {
    expect(pastDueDeadline('2026-10-02T02:00:00Z')).toBe('2026-10-08')
  })
})

describe('planos por tipo de workspace', () => {
  it('consultório: Autônomo e Fundadores; clínica: só Clínica', () => {
    expect(plansForWorkspace('individual').map(p => p.code)).toEqual(['autonomo', 'fundador'])
    expect(plansForWorkspace('clinic').map(p => p.code)).toEqual(['clinica'])
  })

  it('Fundadores só tem mensal', () => {
    expect(cycleFor(planByCode('fundador'), 'annual')).toBe('monthly')
    expect(cycleFor(planByCode('autonomo'), 'annual')).toBe('annual')
  })
})

describe('conta de vagas da clínica', () => {
  const clinica = planByCode('clinica')

  it('mínimo de 2 psicólogas', () => {
    expect(billedSeats(clinica, 0)).toBe(2)
    expect(billedSeats(clinica, 1)).toBe(2)
    expect(billedSeats(clinica, 5)).toBe(5)
    expect(billedSeats(planByCode('autonomo'), 5)).toBe(1)
  })

  it('multiplica o preço por psicóloga', () => {
    expect(planTotals(clinica, 'monthly', 3)).toEqual({ monthlyCents: 10500, annualTotalCents: undefined })
    expect(planTotals(clinica, 'annual', 3)).toEqual({ monthlyCents: 8700, annualTotalCents: 104400 })
    expect(planTotals(planByCode('autonomo'), 'annual', 3)).toEqual({ monthlyCents: 3900, annualTotalCents: 46800 })
  })
})

describe('quem vê e quem gerencia a cobrança', () => {
  const individual = { role: 'psychologist' as const, workspace: { organizationId: 'o1', type: 'individual', roles: [], active: true } }
  const clinicMember = { role: 'psychologist' as const, workspace: { organizationId: 'o2', type: 'clinic', roles: ['psychologist' as const], active: true } }
  const clinicAdmin = { role: 'org_admin' as const, workspace: { organizationId: 'o2', type: 'clinic', roles: ['clinic_admin' as const], active: true } }

  it('paciente não tem cobrança', () => {
    expect(hasBilling({ role: 'patient' })).toBe(false)
    expect(canManageBilling({ role: 'patient' })).toBe(false)
  })

  it('na clínica só a administração assina', () => {
    expect(canManageBilling(individual)).toBe(true)
    expect(canManageBilling(clinicMember)).toBe(false)
    expect(canManageBilling(clinicAdmin)).toBe(true)
  })

  it('chave de cache por organização', () => {
    expect(subscriptionKey('o1')).not.toBe(subscriptionKey('o2'))
  })
})

describe('contrato da cobrança com o BFF', () => {
  it('aceita a assinatura como a API devolve', () => {
    expect(subscriptionSchema.parse({ ...trial, status: 'active', planCode: 'clinica', billingCycle: 'monthly', seats: 3 }).seats).toBe(3)
    expect(subscriptionSchema.safeParse({ ...trial, status: 'unknown' }).success).toBe(false)
  })

  it('checkout só com plano e ciclo do catálogo', () => {
    expect(checkoutBodySchema.safeParse({ plan: 'fundador', cycle: 'monthly' }).success).toBe(true)
    expect(checkoutBodySchema.safeParse({ plan: 'premium', cycle: 'monthly' }).success).toBe(false)
    expect(checkoutBodySchema.safeParse({ plan: 'autonomo', cycle: 'monthly', seats: 9 }).success).toBe(false)
  })

  it('só redireciona para o Stripe', () => {
    expect(stripeRedirectSchema.safeParse({ url: 'https://checkout.stripe.com/c/pay/cs_test_1' }).success).toBe(true)
    expect(stripeRedirectSchema.safeParse({ url: 'https://billing.stripe.com/p/session/x' }).success).toBe(true)
    expect(stripeRedirectSchema.safeParse({ url: 'https://evil.example/stripe.com' }).success).toBe(false)
    expect(stripeRedirectSchema.safeParse({ url: 'http://checkout.stripe.com/x' }).success).toBe(false)
  })
})

describe('erros da cobrança em português', () => {
  const err = (statusCode: number, message?: string) => ({ statusCode, data: message ? { message } : undefined })

  it('cada status tem uma mensagem própria', () => {
    const messages = [400, 403, 503, 502].map(s => billingErrorMessage(err(s), 'checkout'))
    expect(new Set(messages).size).toBe(4)
    expect(billingErrorMessage(err(409, 'as vagas do plano Fundadores acabaram'), 'checkout')).toMatch(/Fundadores acabaram/)
    expect(billingErrorMessage(err(409, 'esta conta já tem uma assinatura'), 'checkout')).toMatch(/já tem uma assinatura/)
    expect(billingErrorMessage(err(404), 'portal')).toMatch(/Escolha um plano/)
  })

  it('402 em qualquer tela explica o modo só leitura', () => {
    expect(apiErrorMessage(err(402), { default: 'outro texto' })).toContain(READ_ONLY_MESSAGE)
  })
})

describe('cartão e faturas', () => {
  it('rótulos da situação da fatura', () => {
    expect(invoiceStatusMeta('paid')).toEqual({ label: 'Paga', variant: 'positive' })
    expect(invoiceStatusMeta('open').label).toBe('Em aberto')
    expect(invoiceStatusMeta('uncollectible').label).toBe('Recusada')
    expect(invoiceStatusMeta('void').label).toBe('Cancelada')
  })

  it('período da fatura no mês de São Paulo', () => {
    // 1/11 01:00 UTC ainda é 31/10 em São Paulo.
    expect(invoicePeriodLabel('2026-11-01T01:00:00Z')).toBe('Outubro 2026')
    expect(invoicePeriodLabel('2026-11-01T12:00:00Z')).toBe('Novembro 2026')
    expect(invoicePeriodLabel(null)).toBe('—')
  })

  it('datas por extenso no fuso do app, com ano só quando muda', () => {
    expect(longDate('2026-11-10T00:54:43Z', '2026-10-09T12:00:00Z')).toBe('9 de novembro')
    expect(longDate('2027-01-01T12:00:00Z', '2026-10-09T12:00:00Z')).toBe('1 de janeiro de 2027')
    expect(longCalendarDate('2026-10-08', '2026-10-09T12:00:00Z')).toBe('8 de outubro')
  })

  it('validade do cartão', () => {
    expect(cardExpiry(8, 2028)).toBe('08/28')
    expect(cardExpiry(12, 2030)).toBe('12/30')
  })

  it('contrato dos detalhes: links fora do Stripe são descartados', () => {
    const parsed = billingDetailsSchema.parse({
      card: { brand: 'visa', last4: '4242', expMonth: 8, expYear: 2028 },
      invoices: [{ id: 'in_1', number: 'A-1', periodStart: '2026-10-10T00:00:00Z', periodEnd: null, amountCents: 4900, status: 'paid', pdfUrl: 'https://pay.stripe.com/invoice/x/pdf', hostedUrl: 'https://evil.example/x' }],
      cancelAtPeriodEnd: false,
      cancelAt: null,
    })
    expect(parsed.invoices[0]!.pdfUrl).toBe('https://pay.stripe.com/invoice/x/pdf')
    expect(parsed.invoices[0]!.hostedUrl).toBe('')
    expect(billingDetailsSchema.safeParse({ card: null, invoices: [], cancelAtPeriodEnd: true, cancelAt: '2026-11-10T00:00:00Z' }).success).toBe(true)
  })

  it('portal aceita só o fluxo de troca de cartão', () => {
    expect(portalBodySchema.safeParse({}).success).toBe(true)
    expect(portalBodySchema.safeParse({ flow: 'payment_method_update' }).success).toBe(true)
    expect(portalBodySchema.safeParse({ flow: 'subscription_cancel' }).success).toBe(false)
  })

  it('cancelar sem assinatura paga tem mensagem própria', () => {
    expect(billingErrorMessage({ statusCode: 409 }, 'cancel')).toMatch(/Não há assinatura paga/)
    expect(billingErrorMessage({ statusCode: 404 }, 'details')).toMatch(/cartão e as faturas/)
  })
})
