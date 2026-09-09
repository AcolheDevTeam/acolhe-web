import { describe, expect, it } from 'vitest'
import type { Activity } from '~/types'
import { activityQueueGroup, activitySummary, groupActivityQueue, isActivityOverdue } from '~/utils/activity-queue'
import { formatDate, formatDateTime } from '~/utils/format'

const now = new Date('2026-09-09T12:00:00Z')
const past = '2026-09-01T10:00:00Z'
const future = '2026-09-20T10:00:00Z'

const make = (over: Partial<Activity>): Activity => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  patientId: 'p1',
  title: 'RPD',
  type: 'record',
  status: 'pending',
  ...over,
})

describe('activityQueueGroup', () => {
  it('usa o vocabulário real da API', () => {
    expect(activityQueueGroup({ status: 'submitted' }, now)).toBe('awaiting_review')
    expect(activityQueueGroup({ status: 'reviewed' }, now)).toBe('reviewed')
    expect(activityQueueGroup({ status: 'pending', dueAt: future }, now)).toBe('assigned')
    expect(activityQueueGroup({ status: 'in_progress', dueAt: future }, now)).toBe('assigned')
    expect(activityQueueGroup({ status: 'pending', dueAt: null }, now)).toBe('assigned')
    expect(activityQueueGroup({ status: 'expired' }, now)).toBe('closed')
    expect(activityQueueGroup({ status: 'canceled' }, now)).toBe('closed')
  })

  it('atraso é calculado pelo prazo, só para atividades abertas', () => {
    expect(activityQueueGroup({ status: 'pending', dueAt: past }, now)).toBe('overdue')
    expect(activityQueueGroup({ status: 'in_progress', dueAt: past }, now)).toBe('overdue')
    expect(activityQueueGroup({ status: 'submitted', dueAt: past }, now)).toBe('awaiting_review')
    expect(activityQueueGroup({ status: 'reviewed', dueAt: past }, now)).toBe('reviewed')
    expect(isActivityOverdue({ status: 'pending', dueAt: 'data inválida' }, now)).toBe(false)
  })

  it('status desconhecido não some da fila', () => {
    expect(activityQueueGroup({ status: 'algo_novo' }, now)).toBe('assigned')
  })
})

describe('groupActivityQueue', () => {
  it('agrupa na ordem de acionabilidade e omite seções vazias', () => {
    const list = [
      make({ id: 'a', status: 'pending', dueAt: future }),
      make({ id: 'b', status: 'submitted' }),
      make({ id: 'c', status: 'pending', dueAt: past }),
      make({ id: 'd', status: 'submitted' }),
    ]
    const sections = groupActivityQueue(list, now)
    expect(sections.map((s) => s.key)).toEqual(['awaiting_review', 'overdue', 'assigned'])
    expect(sections[0]!.label).toBe('Aguardando revisão')
    expect(sections[0]!.rows.map((r) => r.id)).toEqual(['b', 'd'])
    expect(sections[1]!.rows.map((r) => r.id)).toEqual(['c'])
    expect(sections[2]!.rows.map((r) => r.id)).toEqual(['a'])
  })

  it('nenhuma atividade da API é descartada', () => {
    const statuses = ['pending', 'in_progress', 'submitted', 'reviewed', 'expired', 'canceled']
    const list = statuses.map((status) => make({ status }))
    const total = groupActivityQueue(list, now).reduce((n, s) => n + s.rows.length, 0)
    expect(total).toBe(statuses.length)
  })

  it('lista vazia devolve nenhuma seção', () => {
    expect(groupActivityQueue([], now)).toEqual([])
  })
})

describe('activitySummary', () => {
  it('prioriza o summary vindo da API', () => {
    expect(activitySummary(make({ summary: 'Texto da API' }), now)).toBe('Texto da API')
  })

  it('descreve prazo e resposta em português', () => {
    expect(activitySummary(make({ status: 'pending', dueAt: future }), now)).toBe(`Prazo ${formatDate(future)}`)
    expect(activitySummary(make({ status: 'pending', dueAt: past }), now)).toBe(`Prazo venceu em ${formatDate(past)}`)
    expect(activitySummary(make({ status: 'pending', dueAt: null }), now)).toBe('Sem prazo')
    expect(activitySummary(make({ status: 'submitted', respondedAt: past }), now)).toBe(`Respondida em ${formatDateTime(past)}`)
    expect(activitySummary(make({ status: 'expired' }), now)).toBe('Prazo encerrado sem resposta')
    expect(activitySummary(make({ status: 'canceled' }), now)).toBe('Cancelada')
  })
})
