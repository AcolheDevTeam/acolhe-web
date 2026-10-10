import type { Patient } from '~/types'

// Regras da lista de pacientes (/patients): busca, filtro de abordagem,
// ordenação e a linha de apoio sob o nome. Puras, para testar sem a página.

export type PatientSortKey = 'name' | 'sessions' | 'adherence'
export interface PatientSort { key: PatientSortKey, dir: 'asc' | 'desc' }

export const ALL_APPROACHES = 'all'

const DAY_MS = 24 * 60 * 60 * 1000

// "há 7 meses" a partir do cadastro: é o "desde" do protótipo.
export function relativeSince(iso: string, now: Date = new Date()): string {
  const start = new Date(iso)
  if (Number.isNaN(start.getTime())) return ''
  const days = Math.floor((now.getTime() - start.getTime()) / DAY_MS)
  if (days < 1) return 'desde hoje'
  if (days < 30) return days === 1 ? 'há 1 dia' : `há ${days} dias`
  const months = Math.floor(days / 30)
  if (months < 12) return months === 1 ? 'há 1 mês' : `há ${months} meses`
  const years = Math.floor(days / 365)
  return years === 1 ? 'há 1 ano' : `há ${years} anos`
}

// Linha de apoio: idade (quando a API mandar) + situação do vínculo.
export function patientListMeta(patient: Patient, now: Date = new Date()): string {
  const parts: string[] = []
  if (patient.age) parts.push(`${patient.age} anos`)
  switch (patient.relationshipStatus) {
    case 'pending':
      parts.push('convite enviado')
      break
    case 'paused':
      parts.push('vínculo pausado')
      break
    case 'ended':
      parts.push('vínculo encerrado')
      break
    case 'transferred':
      parts.push('encaminhado(a)')
      break
    default:
      parts.push(relativeSince(patient.createdAt, now))
  }
  return parts.filter(Boolean).join(' · ')
}

export function filterPatients(list: Patient[], search: string, approach: string = ALL_APPROACHES): Patient[] {
  const q = search.trim().toLocaleLowerCase('pt-BR')
  return list.filter(p =>
    (!q || p.fullName.toLocaleLowerCase('pt-BR').includes(q))
    && (approach === ALL_APPROACHES || p.approach === approach))
}

// Sem valor (campo ausente na listagem) vai sempre para o fim.
export function sortPatients(list: Patient[], sort: PatientSort): Patient[] {
  const sign = sort.dir === 'asc' ? 1 : -1
  return list.slice().sort((a, b) => {
    if (sort.key === 'name') return a.fullName.localeCompare(b.fullName, 'pt-BR') * sign
    const field = sort.key === 'sessions' ? 'sessionsCount' : 'adherence'
    const x = a[field]
    const y = b[field]
    if (x == null && y == null) return a.fullName.localeCompare(b.fullName, 'pt-BR')
    if (x == null) return 1
    if (y == null) return -1
    return (x - y) * sign
  })
}

export function approachesOf(list: Patient[]): string[] {
  return [...new Set(list.map(p => p.approach).filter((a): a is string => !!a))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
