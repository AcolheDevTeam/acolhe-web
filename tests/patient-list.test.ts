import { describe, expect, it } from 'vitest'
import type { Patient } from '~/types'
import { approachesOf, filterPatients, patientListMeta, relativeSince, sortPatients } from '~/utils/patient-list'

const now = new Date('2026-10-09T12:00:00Z')

const make = (over: Partial<Patient>): Patient => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  fullName: 'Paciente',
  status: 'active',
  relationshipStatus: 'active',
  createdAt: '2026-03-01T10:00:00Z',
  ...over,
})

describe('relativeSince', () => {
  it('fala em dias, meses e anos', () => {
    expect(relativeSince('2026-10-09T08:00:00Z', now)).toBe('desde hoje')
    expect(relativeSince('2026-10-08T10:00:00Z', now)).toBe('há 1 dia')
    expect(relativeSince('2026-09-01T10:00:00Z', now)).toBe('há 1 mês')
    expect(relativeSince('2026-03-01T10:00:00Z', now)).toBe('há 7 meses')
    expect(relativeSince('2024-09-01T10:00:00Z', now)).toBe('há 2 anos')
    expect(relativeSince('inválida', now)).toBe('')
  })
})

describe('patientListMeta', () => {
  it('mostra idade só quando vem da API e a situação do vínculo', () => {
    expect(patientListMeta(make({ age: 28 }), now)).toBe('28 anos · há 7 meses')
    expect(patientListMeta(make({ relationshipStatus: 'pending' }), now)).toBe('convite enviado')
    expect(patientListMeta(make({ relationshipStatus: 'ended' }), now)).toBe('vínculo encerrado')
    expect(patientListMeta(make({ relationshipStatus: 'transferred' }), now)).toBe('encaminhado(a)')
  })
})

describe('filterPatients / sortPatients', () => {
  const list = [
    make({ fullName: 'Júlia Andrade', approach: 'TCC', sessionsCount: 28 }),
    make({ fullName: 'Ana Lopes', approach: 'ACT' }),
    make({ fullName: 'Pedro Tavares', approach: 'TCC', sessionsCount: 42 }),
  ]

  it('busca por nome sem diferenciar maiúsculas e filtra por abordagem', () => {
    expect(filterPatients(list, 'júlia').map(p => p.fullName)).toEqual(['Júlia Andrade'])
    expect(filterPatients(list, '', 'TCC')).toHaveLength(2)
    expect(filterPatients(list, '  ')).toHaveLength(3)
  })

  it('ordena por nome e por número, com vazios no fim', () => {
    expect(sortPatients(list, { key: 'name', dir: 'asc' }).map(p => p.fullName))
      .toEqual(['Ana Lopes', 'Júlia Andrade', 'Pedro Tavares'])
    expect(sortPatients(list, { key: 'sessions', dir: 'desc' }).map(p => p.fullName))
      .toEqual(['Pedro Tavares', 'Júlia Andrade', 'Ana Lopes'])
    expect(sortPatients(list, { key: 'sessions', dir: 'asc' }).map(p => p.fullName))
      .toEqual(['Júlia Andrade', 'Pedro Tavares', 'Ana Lopes'])
  })

  it('lista as abordagens presentes, sem repetir', () => {
    expect(approachesOf(list)).toEqual(['ACT', 'TCC'])
  })
})
