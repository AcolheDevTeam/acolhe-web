import { describe, expect, it } from 'vitest'
import { addMonths, appointmentTone, dayLongLabel, monthCells, monthLabel, rangeLabel, weekDays, weekdayAbbr } from '../utils/agenda'

describe('grade da agenda (novo design)', () => {
  it('semana de segunda a sábado; domingo só quando tem sessão', () => {
    expect(weekDays('2026-10-09', false)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'])
    expect(weekDays('2026-10-11', true).at(-1)).toBe('2026-10-11')
  })

  it('rótulos do período em pt-BR', () => {
    expect(rangeLabel('2026-10-05', '2026-10-10')).toBe('5 a 10 de outubro')
    expect(rangeLabel('2026-09-28', '2026-10-03')).toBe('28 de setembro a 3 de outubro')
    expect(dayLongLabel('2026-10-09')).toBe('Sexta, 9 de outubro')
    expect(monthLabel('2026-10-09')).toBe('Outubro de 2026')
    expect(weekdayAbbr('2026-10-05')).toBe('seg')
  })

  it('mês começa no domingo e fecha semanas inteiras', () => {
    const cells = monthCells('2026-10-20')
    expect(cells.length % 7).toBe(0)
    expect(cells.slice(0, 5)).toEqual([null, null, null, null, '2026-10-01'])
    expect(cells.filter(Boolean)).toHaveLength(31)
  })

  it('soma meses a partir do dia 1, sem pular fevereiro', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-01')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-01')
  })

  it('status desconhecido cai no estilo de agendada', () => {
    expect(appointmentTone('foo')).toBe(appointmentTone('scheduled'))
  })
})
