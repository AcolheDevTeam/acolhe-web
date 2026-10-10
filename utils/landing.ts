import type { BillingCycle, Plan } from '~/utils/plans'
import { formatBRL } from '~/utils/plans'

// Helpers da landing page (/). Os valores vêm sempre de utils/plans.ts.

export interface PlanDisplay {
  /** Ciclo efetivamente mostrado: Fundadores só tem mensal. */
  cycle: BillingCycle
  price: string
  unit: string
  caption: string
}

export function planDisplay(plan: Plan, cycle: BillingCycle): PlanDisplay {
  const effective: BillingCycle = plan.prices[cycle] ? cycle : 'monthly'
  const price = plan.prices[effective] ?? plan.prices.monthly
  if (!price) throw new Error(`plano sem preço: ${plan.code}`)
  const seat = plan.perSeat ? ' por psicóloga(o)' : ''
  let caption: string
  if (effective === 'annual' && price.annualTotalCents) caption = `${formatBRL(price.annualTotalCents)} por ano${seat}, cobrado de uma vez`
  else if (cycle === 'annual') caption = 'Só no plano mensal'
  else caption = 'Cobrado todo mês'
  return { cycle: effective, price: formatBRL(price.monthlyCents), unit: `/mês${seat}`, caption }
}

/** Maior desconto do anual sobre o mensal, em % inteiro (0 se nenhum plano tem anual). */
export function maxAnnualDiscount(plans: Plan[]): number {
  let best = 0
  for (const plan of plans) {
    const monthly = plan.prices.monthly?.monthlyCents
    const annual = plan.prices.annual?.monthlyCents
    if (monthly && annual) best = Math.max(best, Math.round((1 - annual / monthly) * 100))
  }
  return best
}

/** Atraso da entrada escalonada (80ms por passo, como no protótipo), com teto. */
export function revealDelay(step: number, max = 6): number {
  if (!Number.isFinite(step) || step <= 0) return 0
  return Math.min(Math.floor(step), max) * 80
}

/** mailto do "Fale com a gente"; vazio quando não há e-mail configurado. */
export function contactHref(email: string | undefined, subject: string): string {
  const address = email?.trim()
  if (!address) return ''
  return `mailto:${address}?subject=${encodeURIComponent(subject)}`
}

/** Valor da contagem no instante `progress` (0–1), com desaceleração no fim. */
export function countUpValue(target: number, progress: number): number {
  const t = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 1))
  return Math.round(target * (1 - (1 - t) ** 3))
}

/**
 * Seção ativa do menu: a última cujo topo já passou da linha de leitura
 * (`line`, em px a partir do topo da janela). Antes da primeira, nenhuma.
 */
export function activeSectionId(sections: { id: string, top: number }[], line: number): string | undefined {
  let active: string | undefined
  for (const section of sections) {
    if (section.top <= line) active = section.id
  }
  return active
}
