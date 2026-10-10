import { describe, expect, it } from 'vitest'
import { moodAverageLabel, moodLabel, recentCheckinDays } from '../utils/checkin'

describe('recentCheckinDays', () => {
  it('monta os últimos dias terminando hoje, no fuso do check-in', () => {
    // 2026-10-10 01:00 UTC ainda é 9 de outubro (sexta) em Fortaleza.
    const cells = recentCheckinDays([
      { day: '2026-10-09', mood: 4 },
      { day: '2026-10-07', mood: 2 },
      { day: '2026-09-20', mood: 5 },
    ], 14, new Date('2026-10-10T01:00:00Z'))
    expect(cells).toHaveLength(14)
    expect(cells[13]).toEqual({ day: '2026-10-09', weekday: 'sex', mood: 4 })
    expect(cells[11]!.mood).toBe(2)
    expect(cells[12]!.mood).toBeNull()
    expect(cells[0]!.day).toBe('2026-09-26')
  })
})

describe('moodAverageLabel', () => {
  it('faz a média só dos dias com registro', () => {
    const cells = recentCheckinDays([
      { day: '2026-10-09', mood: 4 },
      { day: '2026-10-08', mood: 3 },
    ], 7, new Date('2026-10-09T15:00:00Z'))
    expect(moodAverageLabel(cells)).toBe('3,5 de 5')
    expect(moodAverageLabel(recentCheckinDays([], 7))).toBeNull()
  })
})

describe('moodLabel', () => {
  it('nomeia os cinco níveis', () => {
    expect(moodLabel(1)).toBe('Difícil')
    expect(moodLabel(5)).toBe('Bem')
  })
})
