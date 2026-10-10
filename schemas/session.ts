import { z } from 'zod'

export const sessionNotesSchema = z.string().trim()
  .max(10000, 'A evolução deve ter no máximo 10.000 caracteres')
  .refine(value => new TextEncoder().encode(value).length <= 10000, 'O texto da evolução excede o limite de 10 KB')
  .default('')

// Prontuário estruturado (ACO-101). O texto vai como foi digitado, sem trim:
// a API só trata como vazia a seção feita apenas de espaços. O limite é por
// seção, em caracteres (a API conta caracteres, não bytes).
export const RECORD_SECTION_MAX = 10000

export const RECORD_SECTIONS = [
  { key: 'demand', label: 'Demanda e objetivos', rows: 2 },
  { key: 'evolution', label: 'Evolução desta sessão', rows: 5 },
  { key: 'conduct', label: 'Conduta', rows: 3 },
  { key: 'referral', label: 'Encaminhamento ou encerramento', rows: 2 },
] as const

export type RecordSectionKey = typeof RECORD_SECTIONS[number]['key']

function recordSection(label: string) {
  return z.string({ invalid_type_error: `Preencha o campo ${label} com texto.` })
    .refine(value => [...value].length <= RECORD_SECTION_MAX, `${label}: no máximo 10.000 caracteres.`)
    .refine(value => !value.includes('\u0000'), `${label}: o texto tem um caractere inválido.`)
    .default('')
}

// Mensagens com o mesmo rótulo do campo na tela (e da API).
const sectionLabel = (key: RecordSectionKey) => RECORD_SECTIONS.find(section => section.key === key)!.label

export const updateSessionRecordSchema = z.object({
  demand: recordSection(sectionLabel('demand')),
  evolution: recordSection(sectionLabel('evolution')),
  conduct: recordSection(sectionLabel('conduct')),
  referral: recordSection(sectionLabel('referral')),
  version: z.number({ required_error: 'Versão do prontuário ausente. Recarregue a página.' }).int().positive(),
})

export type UpdateSessionRecordInput = z.infer<typeof updateSessionRecordSchema>

// Contrato entre frontend e backend — espelha as regras das queries.
export const createSessionSchema = z.object({
  patientId: z.string({ required_error: 'Selecione um paciente' }).uuid('Selecione um paciente'),
  occurredAt: z.string({ required_error: 'Informe a data e a hora da sessão' })
    .datetime({ message: 'Informe a data e a hora da sessão' })
    .refine(value => new Date(value) >= new Date('1900-01-01T00:00:00Z'),
      'A data da sessão deve ser a partir de 01/01/1900')
    .refine(value => new Date(value) <= new Date(), 'Para uma sessão futura, crie um agendamento'),
  notes: sessionNotesSchema,
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
