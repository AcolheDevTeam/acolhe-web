import { describe, expect, it } from 'vitest'
import { formatBRL, PLANS, planByCode } from '../utils/plans'

// Os valores precisam bater com o catálogo da API (internal/billing/gateway.go).
describe('planos (ACO-95)', () => {
  it('preços decididos em 2026-10-09', () => {
    expect(planByCode('autonomo').prices.monthly?.monthlyCents).toBe(4900)
    expect(planByCode('autonomo').prices.annual?.annualTotalCents).toBe(46800)
    expect(planByCode('clinica').prices.monthly?.monthlyCents).toBe(3500)
    expect(planByCode('clinica').prices.annual?.annualTotalCents).toBe(34800)
    expect(planByCode('clinica').minSeats).toBe(2)
    expect(planByCode('fundador').prices.monthly?.monthlyCents).toBe(3900)
    expect(planByCode('fundador').prices.annual).toBeUndefined()
  })

  it('anual é 12 vezes o equivalente mensal', () => {
    for (const plan of PLANS) {
      const annual = plan.prices.annual
      if (annual) expect(annual.annualTotalCents).toBe(annual.monthlyCents * 12)
    }
  })

  it('formata em reais', () => {
    expect(formatBRL(4900).replace(/\s/g, ' ')).toBe('R$ 49')
    expect(formatBRL(46800).replace(/\s/g, ' ')).toBe('R$ 468')
  })
})
