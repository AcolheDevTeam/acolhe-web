import { describe, expect, it } from 'vitest'
import { patientRecordSessionDetailSchema, patientRecordSessionsSchema } from '../schemas/patient'
import {
  historyDateLabel,
  historyDetailMeta,
  historyListMeta,
  historyVersionLabel,
  patientHistoryErrorMessage,
} from '../utils/patient-history'

const base = {
  id: '11111111-1111-4111-8111-111111111111',
  number: 28,
  occurredAt: '2026-10-09T17:00:00Z',
  updatedAt: '2026-10-09T18:12:00Z',
  version: 3,
  modality: 'online',
  hasNotes: true,
}

describe('contrato do Meu prontuário', () => {
  it('aceita a lista sem texto e modalidade nula', () => {
    expect(patientRecordSessionsSchema.parse([base, { ...base, modality: null, hasNotes: false }])).toHaveLength(2)
  })

  it('exige o texto na leitura e aceita duração ausente ou nula', () => {
    expect(patientRecordSessionDetailSchema.safeParse(base).success).toBe(false)
    expect(patientRecordSessionDetailSchema.safeParse({ ...base, notes: '' }).success).toBe(true)
    expect(patientRecordSessionDetailSchema.safeParse({ ...base, notes: 'x', durationMinutes: null }).success).toBe(true)
    expect(patientRecordSessionDetailSchema.safeParse({ ...base, notes: 'x', durationMinutes: 50 }).success).toBe(true)
  })

  it('recusa id que não é uuid', () => {
    expect(patientRecordSessionsSchema.safeParse([{ ...base, id: '1' }]).success).toBe(false)
  })
})

describe('textos do Meu prontuário', () => {
  const now = new Date('2026-10-10T12:00:00Z')

  it('mostra a data no fuso de Brasília, com ano só se for outro ano', () => {
    expect(historyDateLabel('2026-10-10T01:00:00Z', now)).toBe('9 de outubro')
    expect(historyDateLabel('2025-12-01T15:00:00Z', now)).toBe('1 de dezembro de 2025')
  })

  it('monta a linha da lista', () => {
    expect(historyListMeta(base)).toBe('Sessão 28 · Online')
    expect(historyListMeta({ ...base, modality: 'in_person', hasNotes: false })).toBe('Sessão 28 · Presencial · Sem anotações')
    expect(historyListMeta({ ...base, modality: null })).toBe('Sessão 28')
  })

  it('monta modalidade e duração da sessão', () => {
    expect(historyDetailMeta({ modality: 'online', durationMinutes: 50 })).toBe('Online · 50 min')
    expect(historyDetailMeta({ modality: null, durationMinutes: null })).toBe('')
  })

  it('mostra a versão e a última atualização', () => {
    expect(historyVersionLabel(base, now)).toBe('Versão 3 · atualizada em 9 out, 15h12')
    expect(historyVersionLabel({ version: 1, updatedAt: '2025-03-02T12:00:00Z' }, now)).toBe('Versão 1 · atualizada em 2 mar 2025, 09h00')
  })

  it('diferencia os erros', () => {
    expect(patientHistoryErrorMessage({ statusCode: 404 }, 'session')).toBe('Sessão não encontrada.')
    expect(patientHistoryErrorMessage({ statusCode: 403 }, 'list')).toBe('Esta área é só para pacientes.')
    expect(patientHistoryErrorMessage({ statusCode: 502 }, 'list')).toBe('O seu histórico chegou incompleto. Tente novamente em instantes.')
    expect(patientHistoryErrorMessage({ statusCode: 500 }, 'session')).toBe('Não foi possível abrir o registro desta sessão agora. Tente novamente.')
  })
})
