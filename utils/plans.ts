// Planos e preços do Acolhe (ACO-95), decididos em 2026-10-09. Fonte única
// para a landing page e as telas de assinatura; os valores cobrados de fato
// vivem no Stripe (catálogo da API em internal/billing/gateway.go) e precisam
// bater com estes.

export type PlanCode = 'autonomo' | 'clinica' | 'fundador'
export type BillingCycle = 'monthly' | 'annual'

export interface PlanPrice {
  /** Centavos por mês (no anual, o equivalente mensal). */
  monthlyCents: number
  /** Centavos cobrados por ano no ciclo anual. */
  annualTotalCents?: number
}

export interface Plan {
  code: PlanCode
  name: string
  audience: string
  perSeat: boolean
  minSeats: number
  prices: Partial<Record<BillingCycle, PlanPrice>>
  features: string[]
  note?: string
}

export const TRIAL_DAYS = 7
export const FOUNDERS_LIMIT = 50

const shared = [
  'Agenda com confirmação do(a) paciente',
  'Prontuário por sessão',
  'Atividades e check-ins entre as sessões',
  'Registro Documental cifrado, só seu',
]

export const PLANS: Plan[] = [
  {
    code: 'autonomo',
    name: 'Autônomo',
    audience: 'Para quem atende no próprio consultório.',
    perSeat: false,
    minSeats: 1,
    prices: {
      monthly: { monthlyCents: 4900 },
      annual: { monthlyCents: 3900, annualTotalCents: 46800 },
    },
    features: shared,
  },
  {
    code: 'clinica',
    name: 'Clínica',
    audience: 'Para equipes: cada psicóloga(o) com a própria agenda e pacientes.',
    perSeat: true,
    minSeats: 2,
    prices: {
      monthly: { monthlyCents: 3500 },
      annual: { monthlyCents: 2900, annualTotalCents: 34800 },
    },
    features: [...shared, 'Painel da clínica com números agregados', 'Convites e gestão da equipe'],
    note: 'Cobrado por psicóloga(o) ativa(o), mínimo de 2.',
  },
  {
    code: 'fundador',
    name: 'Fundadores',
    audience: `Para quem estiver entre as primeiras ${FOUNDERS_LIMIT} assinaturas.`,
    perSeat: false,
    minSeats: 1,
    prices: {
      monthly: { monthlyCents: 3900 },
    },
    features: shared,
    note: 'Preço travado enquanto a assinatura estiver ativa. Só mensal.',
  },
]

export function planByCode(code: PlanCode): Plan {
  const plan = PLANS.find(item => item.code === code)
  if (!plan) throw new Error(`plano desconhecido: ${code}`)
  return plan
}

/** R$ 49 (sem centavos quando inteiro). */
export function formatBRL(cents: number): string {
  const value = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}
