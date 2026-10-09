import { describe, expect, it } from 'vitest'
import { patientEyebrowDate } from '../utils/patient-date'

describe('patientEyebrowDate', () => {
  it('formata como no protótipo, no fuso de Brasília', () => {
    // 2026-10-10 01:00 UTC ainda é sexta, 9 de outubro, em São Paulo.
    expect(patientEyebrowDate(new Date('2026-10-10T01:00:00Z'))).toBe('Sexta · 9 out')
  })
})
