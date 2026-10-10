import { describe, expect, it } from 'vitest'
import { inactiveLinkReason, openWithoutLink } from '~/utils/patient-link'

describe('inactiveLinkReason', () => {
  it('vínculo ativo com consentimento não bloqueia', () => {
    expect(inactiveLinkReason({ relationshipStatus: 'active', consented: true })).toBeNull()
    expect(inactiveLinkReason(null)).toBeNull()
  })
  it('explica cada estado', () => {
    expect(inactiveLinkReason({ relationshipStatus: 'ended', consented: true })).toMatch(/encerrado/)
    expect(inactiveLinkReason({ relationshipStatus: 'paused', consented: true })).toMatch(/pausado/)
    expect(inactiveLinkReason({ relationshipStatus: 'active', consented: false })).toMatch(/não foi confirmado/)
  })
  it('vínculo pausado pela revogação diz o motivo', () => {
    expect(inactiveLinkReason({ relationshipStatus: 'paused', consented: false })).toMatch(/consentimento de dados de saúde foi revogado/)
  })
})

describe('openWithoutLink', () => {
  it('só o Histórico e os Ajustes abrem sem vínculo', () => {
    expect(openWithoutLink('/patient/historico')).toBe(true)
    expect(openWithoutLink('/patient/historico/abc')).toBe(true)
    expect(openWithoutLink('/patient/ajustes')).toBe(true)
    expect(openWithoutLink('/patient/ajustes/senha')).toBe(true)
    expect(openWithoutLink('/patient')).toBe(false)
    expect(openWithoutLink('/patient/historico-x')).toBe(false)
    expect(openWithoutLink('/patient/ajustes-x')).toBe(false)
  })
})
