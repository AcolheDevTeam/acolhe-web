// Regras de apresentação da cobrança (ACO-95). Preços só de utils/plans.ts;
// datas no fuso do app (utils/timezone.ts), igual no SSR e no browser.
import type { InvoiceStatus, Subscription, SubscriptionStatus } from '~/schemas/billing'
import type { UserRole, WorkspaceContext } from '~/types'
import { apiErrorInfo, apiErrorMessage } from './api-error'
import { PLANS, type BillingCycle, type Plan } from './plans'
import { APP_TIMEZONE, zonedDay } from './timezone'

export const BILLING_PATH = '/assinatura'
/** Dias de aviso antes do fim do teste. */
export const TRIAL_WARNING_DAYS = 3
/** Tolerância de atraso antes do modo só leitura (regra da API). */
export const PAST_DUE_GRACE_DAYS = 7

type SessionUser = { role?: UserRole, workspace?: WorkspaceContext } | null | undefined

/** Chave de cache por workspace: nenhum dado de uma organização aparece na outra. */
export function subscriptionKey(organizationId?: string | null): string {
  return `billing-subscription-${organizationId ?? 'none'}`
}

/** Paciente não tem assinatura nem vê avisos de cobrança. */
export function hasBilling(user: SessionUser): boolean {
  return !!user && user.role !== 'patient' && user.role !== 'platform_admin' && !!user.workspace
}

/** Quem pode assinar: na clínica só responsável/administração; no consultório, a própria psicóloga. */
export function canManageBilling(user: SessionUser): boolean {
  if (!hasBilling(user)) return false
  if (user?.workspace?.type !== 'clinic') return true
  const roles = user.workspace.roles ?? []
  return roles.includes('clinic_owner') || roles.includes('clinic_admin')
}

function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000)
}

/** Dias de calendário (America/Sao_Paulo) até o fim do teste; 0 = termina hoje, negativo = já terminou. */
export function trialDaysLeft(trialEndsAt: string, now: Date | string = new Date()): number {
  return dayDiff(zonedDay(now), zonedDay(trialEndsAt))
}

/** Instante (ISO) em que o atraso passa a bloquear a escrita: a API bloqueia 7 × 24 h depois. */
export function pastDueDeadline(pastDueSince: string): string {
  return new Date(Date.parse(pastDueSince) + PAST_DUE_GRACE_DAYS * 86_400_000).toISOString()
}

/** Dias de 24 horas ainda disponíveis antes do bloqueio de escrita por atraso. */
export function pastDueDaysLeft(pastDueSince: string, now: Date | string = new Date()): number {
  const nowMs = typeof now === 'string' ? Date.parse(now) : now.getTime()
  const remaining = Date.parse(pastDueDeadline(pastDueSince)) - nowMs
  return Math.max(0, Math.ceil(remaining / 86_400_000))
}

/** Planos que o tipo de workspace pode assinar (mesma regra da API). */
export function plansForWorkspace(type?: string | null): Plan[] {
  const codes = type === 'clinic' ? ['clinica'] : ['autonomo', 'fundador']
  return PLANS.filter(plan => codes.includes(plan.code))
}

/** Ciclo que vai para o checkout: Fundadores só tem mensal. */
export function cycleFor(plan: Plan, cycle: BillingCycle): BillingCycle {
  return plan.prices[cycle] ? cycle : 'monthly'
}

/** Psicólogas cobradas: as ativas, com o mínimo do plano. */
export function billedSeats(plan: Plan, activePsychologists: number): number {
  if (!plan.perSeat) return 1
  return Math.max(plan.minSeats, Math.max(0, Math.floor(activePsychologists)))
}

/** Total mensal (ou equivalente mensal no anual) e total do ano, já multiplicados pelas vagas. */
export function planTotals(plan: Plan, cycle: BillingCycle, seats = 1): { monthlyCents: number, annualTotalCents?: number } {
  const price = plan.prices[cycleFor(plan, cycle)]
  if (!price) return { monthlyCents: 0 }
  const n = plan.perSeat ? seats : 1
  return {
    monthlyCents: price.monthlyCents * n,
    annualTotalCents: price.annualTotalCents !== undefined ? price.annualTotalCents * n : undefined,
  }
}

export function subscriptionStatusLabel(status: SubscriptionStatus): string {
  return ({ trialing: 'Teste grátis', active: 'Ativa', past_due: 'Pagamento atrasado', canceled: 'Cancelada' })[status]
}

export function cycleLabel(cycle?: BillingCycle | null): string {
  return cycle === 'annual' ? 'anual' : 'mensal'
}

/** Assinatura paga em andamento: mudar de plano é pelo portal do Stripe. */
export function hasPaidSubscription(sub: Pick<Subscription, 'status'> | null | undefined): boolean {
  return sub?.status === 'active' || sub?.status === 'past_due'
}

/** Aviso curto do fim do teste; `null` fora da janela de aviso. */
export function trialBannerText(sub: Subscription | null | undefined, now: Date | string = new Date()): string | null {
  if (!sub || sub.status !== 'trialing' || !sub.writable || !sub.trialEndsAt) return null
  const days = trialDaysLeft(sub.trialEndsAt, now)
  if (days > TRIAL_WARNING_DAYS || days < 0) return null
  if (days === 0) return 'Seu teste termina hoje'
  return `Seu teste termina em ${days} ${days === 1 ? 'dia' : 'dias'}`
}

export type BillingAction = 'checkout' | 'portal' | 'details' | 'cancel' | 'reactivate'

const actionFallback: Record<BillingAction, string> = {
  checkout: 'Não foi possível abrir o pagamento.',
  portal: 'Não foi possível abrir a página do cartão.',
  details: 'Não foi possível carregar o cartão e as faturas agora.',
  cancel: 'Não foi possível cancelar a assinatura agora.',
  reactivate: 'Não foi possível reativar a assinatura agora.',
}

/** Erros das ações de cobrança, por motivo (regra A6). */
export function billingErrorMessage(error: unknown, action: BillingAction): string {
  const { status, technical } = apiErrorInfo(error)
  if (status === 409) {
    if (technical && /fundadores/i.test(technical)) return 'As vagas do plano Fundadores acabaram. Escolha o plano Autônomo.'
    if (action === 'cancel' || action === 'reactivate') return 'Não há assinatura paga para alterar. Atualize a página.'
    return 'Esta conta já tem uma assinatura. Atualize a página para ver os detalhes.'
  }
  return apiErrorMessage(error, {
    400: action === 'checkout' ? 'Este plano não está disponível para este tipo de conta.' : 'O pedido não foi aceito. Atualize a página e tente de novo.',
    403: 'Só a responsável ou a administração da clínica pode assinar e gerenciar a cobrança.',
    404: action === 'portal'
      ? 'Ainda não há cartão cadastrado para esta conta. Escolha um plano para cadastrar.'
      : action === 'details'
        ? actionFallback.details
        : 'Não encontramos a assinatura deste espaço de trabalho. Atualize a página.',
    500: `${actionFallback[action]} Tente de novo em instantes.`,
    502: 'O Stripe não respondeu. Tente de novo em instantes.',
    503: 'A cobrança está indisponível no momento. Tente de novo mais tarde.',
    default: actionFallback[action],
  })
}

/** Situação da fatura no chip (Paga / Em aberto / Recusada / Cancelada). */
export function invoiceStatusMeta(status: InvoiceStatus): { label: string, variant: 'positive' | 'warning' | 'danger' | 'neutral' } {
  return ({
    paid: { label: 'Paga', variant: 'positive' },
    open: { label: 'Em aberto', variant: 'warning' },
    uncollectible: { label: 'Recusada', variant: 'danger' },
    void: { label: 'Cancelada', variant: 'neutral' },
  } as const)[status]
}

const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: APP_TIMEZONE })
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: APP_TIMEZONE })
const dayMonthYear = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: APP_TIMEZONE })

/** "Outubro 2026", no fuso do app. */
export function invoicePeriodLabel(periodStart?: string | null): string {
  if (!periodStart) return '—'
  const label = monthYear.format(new Date(periodStart)).replace(' de ', ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** "9 de novembro" (com o ano quando não for o ano corrente), no fuso do app. */
export function longDate(value: string, now: Date | string = new Date()): string {
  const sameYear = zonedDay(value).slice(0, 4) === zonedDay(now).slice(0, 4)
  return (sameYear ? dayMonth : dayMonthYear).format(new Date(value))
}

/** Dia (`YYYY-MM-DD`) do calendário de São Paulo, para datas de calendário puras. */
export function longCalendarDate(day: string, now: Date | string = new Date()): string {
  return longDate(`${day}T15:00:00Z`, now)
}

/** "08/28". */
export function cardExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${String(year % 100).padStart(2, '0')}`
}

export function cardBrandLabel(brand: string): string {
  return ({ visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', elo: 'Elo', hipercard: 'Hipercard', discover: 'Discover', diners: 'Diners' } as Record<string, string>)[brand.toLowerCase()] ?? 'Cartão'
}
