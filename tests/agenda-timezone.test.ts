import { describe, expect, it } from 'vitest'
import { addCalendarDays, calendarDayLabel, weekStart, zonedDay, zonedParts } from '../utils/timezone'
import { formatDate, formatTime } from '../utils/format'
import { appointmentConflictMessage, finalStatusConfirmation } from '../utils/appointment-errors'

describe('fuso da agenda (ACO-83)', () => {
  it('sessão às 22h de segunda em Brasília continua na segunda', () => {
    // 22h BRT = 01h UTC de terça: o SSR em UTC colocava na coluna de terça.
    expect(zonedParts('2026-10-06T01:00:00Z')).toEqual({ day: '2026-10-05', hour: 22, minute: 0 })
    expect(zonedDay('2026-10-06T01:00:00Z')).toBe('2026-10-05')
  })

  it('meia-noite sai como 0h, não 24h', () => {
    expect(zonedParts('2026-10-05T03:00:00Z').hour).toBe(0)
  })

  it('semana começa na segunda, inclusive a partir de domingo', () => {
    expect(weekStart('2026-10-09')).toBe('2026-10-05')
    expect(weekStart('2026-10-11')).toBe('2026-10-05')
    expect(weekStart('2026-10-05')).toBe('2026-10-05')
  })

  it('soma dias de calendário atravessando mês e ano', () => {
    expect(addCalendarDays('2026-12-29', 7)).toBe('2027-01-05')
    expect(addCalendarDays('2026-03-02', -7)).toBe('2026-02-23')
  })

  it('rótulo do dia não depende do fuso', () => {
    expect(calendarDayLabel('2026-10-05')).toMatch(/seg\.?, 05\/10/)
  })
})

describe('formatadores com fuso explícito', () => {
  it('instante sai no horário de Brasília', () => {
    expect(formatTime('2026-10-06T01:00:00Z')).toBe('22:00')
    expect(formatDate('2026-10-06T01:00:00Z')).toBe('05/10/2026')
  })

  it('data pura (nascimento) não volta um dia', () => {
    expect(formatDate('1990-05-01')).toBe('01/05/1990')
  })
})

describe('409 da agenda com mensagem específica (A6)', () => {
  const conflict = (message: string) => ({ statusCode: 409, data: { message } })

  it('reconhece cada caso pelo texto técnico, sem exibi-lo', () => {
    expect(appointmentConflictMessage(conflict('este atendimento já tem evolução registrada no prontuário')))
      .toContain('já tem evolução no prontuário')
    expect(appointmentConflictMessage(conflict('o atendimento ainda não aconteceu')))
      .toContain('ainda não aconteceu')
    expect(appointmentConflictMessage(conflict('conflito de horário na agenda')))
      .toContain('outra sessão neste horário')
  })

  it('deixa outros casos para o texto padrão', () => {
    expect(appointmentConflictMessage(conflict('transição de status inválida'))).toBeNull()
    expect(appointmentConflictMessage({ statusCode: 404, data: { message: 'conflito de horário' } })).toBeNull()
  })

  it('toda ação sem volta tem confirmação', () => {
    expect(Object.keys(finalStatusConfirmation).sort()).toEqual(['canceled', 'completed', 'no_show'])
  })
})

describe('BFF repassa o motivo do 4xx (ACO-83)', async () => {
  // createError é auto-importado no Nitro; no teste basta guardar as opções.
  ;(globalThis as { createError?: unknown }).createError = (options: object) => ({ ...options })
  const { relayApiError } = await import('../server/utils/apiFetch')

  it('4xx leva status e a mensagem curta da API em data', () => {
    const relayed = relayApiError({ response: { status: 409 }, data: { message: 'conflito de horário na agenda' } }) as { statusCode: number, data?: { message?: string } }
    expect(relayed.statusCode).toBe(409)
    expect(relayed.data?.message).toBe('conflito de horário na agenda')
    expect(appointmentConflictMessage(relayed)).toContain('outra sessão neste horário')
  })

  it('5xx não leva detalhe nenhum', () => {
    const relayed = relayApiError({ response: { status: 500 }, data: { message: 'erro interno' } }) as { statusCode: number, data?: unknown }
    expect(relayed.statusCode).toBe(500)
    expect(relayed.data).toBeUndefined()
  })

  it('falha de rede segue como está', () => {
    const network = new Error('fetch failed')
    expect(relayApiError(network)).toBe(network)
  })
})
