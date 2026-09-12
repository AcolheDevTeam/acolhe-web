import { describe, expect, it } from 'vitest'
import {
  patientActivityDetailSchema,
  submissionRequestSchema,
  submissionResponseSchema,
} from '~/schemas/patient-activity'

const detalhe = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'pending',
  title: 'Registro de pensamentos',
  type: 'record',
  description: null,
  instructions: 'Preencha logo após a situação.',
  templateVersion: 1,
  scheduledFor: null,
  dueAt: '2026-09-14T12:00:00Z',
  submittedAt: null,
  canRespond: true,
  fields: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      code: 'descreva_a_situacao',
      label: 'Descreva a situação',
      fieldType: 'long_text',
      displayOrder: 1,
      config: { required: true, maxLength: 2000 },
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      code: 'intensidade',
      label: 'Intensidade da emoção',
      fieldType: 'scale',
      displayOrder: 2,
      config: { required: true, min: 1, max: 10 },
    },
  ],
}

describe('contrato da atividade da paciente', () => {
  it('aceita o detalhe que a API devolve', () => {
    const parsed = patientActivityDetailSchema.parse(detalhe)
    expect(parsed.fields).toHaveLength(2)
    expect(parsed.canRespond).toBe(true)
    expect(parsed.fields[1].config.max).toBe(10)
  })

  it('aceita campo sem config configurada', () => {
    const semConfig = {
      ...detalhe,
      fields: [{ ...detalhe.fields[0], config: {} }],
    }
    expect(patientActivityDetailSchema.safeParse(semConfig).success).toBe(true)
  })

  it('rejeita tipo de campo fora do vocabulário acordado com a API', () => {
    const tipoInvalido = {
      ...detalhe,
      fields: [{ ...detalhe.fields[0], fieldType: 'arquivo' }],
    }
    expect(patientActivityDetailSchema.safeParse(tipoInvalido).success).toBe(false)
  })

  it('aceita atividade já respondida, sem permitir resposta', () => {
    const respondida = {
      ...detalhe,
      status: 'submitted',
      submittedAt: '2026-09-12T10:00:00Z',
      canRespond: false,
    }
    const parsed = patientActivityDetailSchema.parse(respondida)
    expect(parsed.canRespond).toBe(false)
    expect(parsed.submittedAt).not.toBeNull()
  })
})

describe('contrato do envio da resposta', () => {
  const envioValido = {
    submissionId: '44444444-4444-4444-8444-444444444444',
    templateVersion: 1,
    values: [
      { fieldCode: 'descreva_a_situacao', kind: 'long_text', text: 'briguei com minha irmã' },
      { fieldCode: 'intensidade', kind: 'scale', number: 8 },
    ],
  }

  it('aceita o envio montado pela tela', () => {
    expect(submissionRequestSchema.safeParse(envioValido).success).toBe(true)
  })

  it('exige submissionId em formato de UUID', () => {
    // É ele que torna o reenvio idempotente; sem UUID a API recusa.
    expect(submissionRequestSchema.safeParse({ ...envioValido, submissionId: 'abc' }).success).toBe(false)
  })

  it('exige que o kind esteja no vocabulário de tipos', () => {
    const kindInvalido = {
      ...envioValido,
      values: [{ fieldCode: 'x', kind: 'texto', text: 'a' }],
    }
    expect(submissionRequestSchema.safeParse(kindInvalido).success).toBe(false)
  })

  it('não aceita envio sem nenhum valor', () => {
    expect(submissionRequestSchema.safeParse({ ...envioValido, values: [] }).success).toBe(false)
  })

  it('aceita os formatos de cada tipo de valor', () => {
    const todos = {
      ...envioValido,
      values: [
        { fieldCode: 'a', kind: 'short_text', text: 'oi' },
        { fieldCode: 'b', kind: 'scale', number: 5 },
        { fieldCode: 'c', kind: 'boolean', boolean: true },
        { fieldCode: 'd', kind: 'date', date: '2026-09-12' },
        { fieldCode: 'e', kind: 'datetime', datetime: '2026-09-12T10:30:00Z' },
        { fieldCode: 'f', kind: 'single_choice', choice: 'bem' },
        { fieldCode: 'g', kind: 'multiple_choice', choices: ['sono', 'apetite'] },
      ],
    }
    expect(submissionRequestSchema.safeParse(todos).success).toBe(true)
  })

  it('aceita a resposta devolvida pela API', () => {
    const parsed = submissionResponseSchema.parse({
      id: '55555555-5555-4555-8555-555555555555',
      assignmentId: '11111111-1111-4111-8111-111111111111',
      submittedAt: '2026-09-12T10:00:00Z',
      isDraft: false,
    })
    expect(parsed.isDraft).toBe(false)
  })
})
