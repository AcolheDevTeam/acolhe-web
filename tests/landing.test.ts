import { describe, expect, it } from 'vitest'
import { activeSectionId, contactHref, countUpValue, maxAnnualDiscount, planDisplay, revealDelay } from '../utils/landing'
import { PLANS, planByCode } from '../utils/plans'

const plain = (s: string) => s.replace(/\s/g, ' ')

describe('landing: preços dos planos', () => {
  it('mensal do Autônomo', () => {
    const view = planDisplay(planByCode('autonomo'), 'monthly')
    expect(plain(view.price)).toBe('R$ 49')
    expect(view.unit).toBe('/mês')
    expect(view.caption).toBe('Cobrado todo mês')
  })

  it('anual mostra o equivalente mensal e o total', () => {
    const view = planDisplay(planByCode('autonomo'), 'annual')
    expect(view.cycle).toBe('annual')
    expect(plain(view.price)).toBe('R$ 39')
    expect(plain(view.caption)).toBe('R$ 468 por ano, cobrado de uma vez')
  })

  it('Clínica é por psicóloga', () => {
    const view = planDisplay(planByCode('clinica'), 'annual')
    expect(view.unit).toBe('/mês por psicóloga(o)')
    expect(plain(view.caption)).toContain('R$ 348 por ano por psicóloga')
  })

  it('Fundadores fica no mensal mesmo com o anual escolhido', () => {
    const view = planDisplay(planByCode('fundador'), 'annual')
    expect(view.cycle).toBe('monthly')
    expect(plain(view.price)).toBe('R$ 39')
    expect(view.caption).toBe('Só no plano mensal')
  })

  it('maior desconto do anual', () => {
    expect(maxAnnualDiscount(PLANS)).toBe(20)
    expect(maxAnnualDiscount([planByCode('fundador')])).toBe(0)
  })
})

describe('landing: utilidades', () => {
  it('escalona a entrada em 80ms com teto', () => {
    expect(revealDelay(0)).toBe(0)
    expect(revealDelay(2)).toBe(160)
    expect(revealDelay(20)).toBe(480)
    expect(revealDelay(Number.NaN)).toBe(0)
  })

  it('não inventa contato sem e-mail configurado', () => {
    expect(contactHref('', 'Plano Clínica')).toBe('')
    expect(contactHref('  ', 'x')).toBe('')
    expect(contactHref('oi@exemplo.com', 'Plano Clínica')).toBe('mailto:oi@exemplo.com?subject=Plano%20Cl%C3%ADnica')
  })
})

describe('landing: movimento', () => {
  it('contagem vai de 0 ao alvo e para no alvo', () => {
    expect(countUpValue(124, 0)).toBe(0)
    expect(countUpValue(124, 1)).toBe(124)
    expect(countUpValue(124, 2)).toBe(124)
    expect(countUpValue(124, 0.5)).toBeGreaterThan(62)
    expect(countUpValue(124, Number.NaN)).toBe(124)
  })

  it('seção ativa é a última que passou da linha', () => {
    const sections = [{ id: 'recursos', top: 300 }, { id: 'planos', top: 900 }]
    expect(activeSectionId(sections, 100)).toBeUndefined()
    expect(activeSectionId(sections, 300)).toBe('recursos')
    expect(activeSectionId(sections, 1200)).toBe('planos')
  })
})
