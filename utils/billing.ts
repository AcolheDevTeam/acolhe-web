// Regras de apresentação da cobrança (ACO-95). Preços só de utils/plans.ts;
// datas no fuso do app (utils/timezone.ts), igual no SSR e no browser.
import type { Subscription, SubscriptionStatus } from '~/schemas/billing'
import type { UserRole, WorkspaceContext } from '~/types'
import { apiErrorInfo, apiErrorMessage } from './api-error'
import { PLANS, type BillingCycle, type Plan } from './plans'
import { addCalendarDays, zonedDay } from './timezone'

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

/** Dia (`YYYY-MM-DD`) em que o atraso passa a bloquear a escrita. */
export function pastDueDeadline(pastDueSince: string): string {
  return addCalendarDays(zonedDay(pastDueSince), PAST_DUE_GRACE_DAYS)
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

/** Erros do checkout e do portal, por motivo (regra A6). */
export function billingErrorMessage(error: unknown, action: 'checkout' | 'portal'): string {
  const { status, technical } = apiErrorInfo(error)
  if (status === 409) {
    if (technical && /fundadores/i.test(technical)) return 'As vagas do plano Fundadores acabaram. Escolha o plano Autônomo.'
    return 'Esta conta já tem uma assinatura. Use "Gerenciar assinatura" para mudar de plano.'
  }
  return apiErrorMessage(error, {
    400: 'Este plano não está disponível para este tipo de conta.',
    403: 'Só a responsável ou a administração da clínica pode assinar e gerenciar a cobrança.',
    404: action === 'portal'
      ? 'Ainda não há assinatura paga para gerenciar. Escolha um plano abaixo.'
      : 'Não encontramos a assinatura deste espaço de trabalho. Atualize a página.',
    500: 'Não conseguimos abrir o pagamento agora. Tente de novo em instantes.',
    502: 'O Stripe não respondeu. Tente de novo em instantes.',
    503: 'A cobrança está indisponível no momento. Tente de novo mais tarde.',
    default: action === 'portal' ? 'Não foi possível abrir o portal de cobrança.' : 'Não foi possível abrir o pagamento.',
  })
}
