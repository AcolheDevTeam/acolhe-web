import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { documentsQuerySchema, generateDocumentSchema, isValidCpf } from '~/schemas/document'
import { apiErrorMessage, READ_ONLY_MESSAGE } from '~/utils/api-error'
import {
  DOCUMENT_LINK_ERRORS,
  DOCUMENT_TYPE_FILTERS,
  DOCUMENT_TYPE_OPTIONS,
  GENERATE_DOCUMENT_ERRORS,
  brlToCents,
  documentLinkLabel,
  documentPreview,
  filterDocuments,
  formatShortDate,
  maskBrl,
  maskCpf,
  sessionChoiceLabel,
} from '~/utils/document'
import { zodPtBrErrorMap } from '~/utils/zod-pt-br'
import type { ClinicalDocument } from '~/types'

z.setErrorMap(zodPtBrErrorMap)

const patientId = '11111111-1111-4111-8111-111111111111'
const sessionId = '22222222-2222-4222-8222-222222222222'
const base = { patientId, type: 'declaration', sessionIds: [sessionId], city: 'São Paulo' }

const messages = (input: unknown) => {
  const result = generateDocumentSchema.safeParse(input)
  return result.success ? {} : Object.fromEntries(result.error.issues.map(i => [String(i.path[0]), i.message]))
}

describe('tipos de documento', () => {
  it('só declaração de comparecimento e recibo (sem atestado)', () => {
    expect(DOCUMENT_TYPE_OPTIONS.map(o => o.value)).toEqual(['declaration', 'receipt'])
    const labels = [...DOCUMENT_TYPE_OPTIONS, ...DOCUMENT_TYPE_FILTERS].map(o => o.label.toLowerCase())
    expect(labels.some(l => l.includes('atestado') || l.includes('relatório'))).toBe(false)
    expect(generateDocumentSchema.safeParse({ ...base, type: 'certificate' }).success).toBe(false)
  })
})

describe('generateDocumentSchema', () => {
  it('aceita a declaração e descarta campos do recibo', () => {
    const result = generateDocumentSchema.parse({ ...base, purpose: '  Empregador  ', amountCents: 100, payerCpf: '529.982.247-25' })
    expect(result).toEqual({ ...base, purpose: 'Empregador' })
  })

  it('recibo exige valor e leva CPF só com dígitos', () => {
    expect(messages({ ...base, type: 'receipt' }).amountCents).toBe('Informe o valor recebido')
    const result = generateDocumentSchema.parse({ ...base, type: 'receipt', amountCents: 15000, payerCpf: '529.982.247-25', purpose: 'x' })
    expect(result).toEqual({ ...base, type: 'receipt', amountCents: 15000, payerCpf: '52998224725' })
  })

  it('mensagens específicas em português', () => {
    expect(messages({ ...base, patientId: '' }).patientId).toBe('Selecione a paciente')
    expect(messages({ ...base, sessionIds: [] }).sessionIds).toBe('Selecione pelo menos uma sessão')
    expect(messages({ ...base, city: '  ' }).city).toBe('Informe a cidade')
    expect(messages({ ...base, type: 'receipt', amountCents: 100, payerCpf: '123' }).payerCpf).toBe('O CPF tem 11 dígitos')
    expect(messages({ ...base, type: 'receipt', amountCents: 100, payerCpf: '111.111.111-11' }).payerCpf).toBe('CPF inválido. Confira os números')
    expect(messages({ ...base, purpose: 'a'.repeat(201) }).purpose).toBe('Use no máximo 200 caracteres na finalidade')
    expect(messages({ ...base, sessionIds: Array(61).fill(sessionId) }).sessionIds).toBe('Selecione no máximo 60 sessões')
  })

  it('CPF vazio não vai para a API', () => {
    const result = generateDocumentSchema.parse({ ...base, type: 'receipt', amountCents: 100, payerCpf: '', payerName: ' ' })
    expect(result).not.toHaveProperty('payerCpf', expect.anything())
    expect((result as { payerName?: string }).payerName).toBeUndefined()
  })

  it('consulta da lista aceita paciente opcional', () => {
    expect(documentsQuerySchema.safeParse({}).success).toBe(true)
    expect(documentsQuerySchema.safeParse({ patientId: 'x' }).success).toBe(false)
  })
})

describe('CPF e valor', () => {
  it('valida dígitos verificadores', () => {
    expect(isValidCpf('52998224725')).toBe(true)
    expect(isValidCpf('52998224724')).toBe(false)
    expect(isValidCpf('00000000000')).toBe(false)
  })

  it('máscaras', () => {
    expect(maskCpf('52998224725')).toBe('529.982.247-25')
    expect(maskCpf('5299')).toBe('529.9')
    expect(maskBrl('15000')).toBe('150,00')
    expect(maskBrl('R$ 1.250,005')).toBe('12.500,05')
    expect(maskBrl('abc')).toBe('')
    expect(brlToCents('1.250,00')).toBe(125000)
    expect(brlToCents('')).toBeUndefined()
  })
})

const doc = (over: Partial<ClinicalDocument>): ClinicalDocument => ({
  id: 'd1', code: 'DC-7K3M-9QX2', type: 'declaration', status: 'ready', patientId, patientName: 'Júlia Andrade',
  sessionDates: [], city: 'São Paulo', sha256: 'a'.repeat(64), createdAt: '2026-10-09T17:00:00Z', readyAt: null, linkExpiresAt: null,
  ...over,
})

describe('lista de emitidos', () => {
  const list = [
    doc({ id: '1' }),
    doc({ id: '2', code: 'RC-AB12-CD34', type: 'receipt', patientId: 'p2', patientName: 'Pedro Tavares' }),
  ]

  it('busca por código (com ou sem hífen) ou paciente sem acento', () => {
    expect(filterDocuments(list, { search: 'julia' }).map(d => d.id)).toEqual(['1'])
    expect(filterDocuments(list, { search: 'rcab12' }).map(d => d.id)).toEqual(['2'])
    expect(filterDocuments(list, { search: 'RC-AB12' }).map(d => d.id)).toEqual(['2'])
    expect(filterDocuments(list, { type: 'receipt' }).map(d => d.id)).toEqual(['2'])
    expect(filterDocuments(list, { patientId })).toHaveLength(1)
  })

  it('situação do link', () => {
    const now = new Date('2026-10-10T12:00:00Z')
    expect(documentLinkLabel(doc({ status: 'pending' }), now).text).toBe('Gerando…')
    expect(documentLinkLabel(doc({ status: 'failed' }), now).text).toBe('Não gerado')
    expect(documentLinkLabel(doc({}), now)).toEqual({ text: 'Sem link ativo', active: false })
    expect(documentLinkLabel(doc({ linkExpiresAt: '2026-10-10T11:00:00Z' }), now).text).toBe('Sem link ativo')
    expect(documentLinkLabel(doc({ linkExpiresAt: '2026-10-11T17:00:00Z' }), now)).toEqual({ text: 'Válido até 11 out, 14h', active: true })
    expect(documentLinkLabel(doc({ linkExpiresAt: '2026-10-11T17:30:00Z' }), now).text).toBe('Válido até 11 out, 14h30')
  })

  it('datas no fuso de São Paulo', () => {
    expect(formatShortDate('2026-10-10T02:00:00Z')).toBe('9 out 2026')
    expect(sessionChoiceLabel('2026-10-09T17:00:00Z')).toEqual({ date: '9 out 2026', hour: '14:00' })
  })
})

describe('pré-visualização', () => {
  const today = new Date('2026-10-09T15:00:00Z')

  it('declaração com finalidade e datas em ordem', () => {
    const p = documentPreview({
      type: 'declaration', patientName: 'Júlia Andrade', city: 'São Paulo', purpose: 'Empregador', today,
      sessionDates: ['2026-10-09T17:00:00Z', '2026-10-02T17:00:00Z'],
    })
    expect(p.body).toBe('Declaro, para os devidos fins, que Júlia Andrade compareceu a sessão de psicoterapia nas datas:')
    expect(p.dates).toEqual(['2 de outubro de 2026, às 14:00', '9 de outubro de 2026, às 14:00'])
    expect(p.purpose).toBe('Finalidade: Empregador')
    expect(p.placeAndDate).toBe('São Paulo, 9 de outubro de 2026.')
  })

  it('recibo com pagador e CPF; sem dados mostra marcadores', () => {
    const p = documentPreview({
      type: 'receipt', patientName: 'Júlia Andrade', city: '', today, sessionDates: [],
      amountCents: 30000, payerName: 'Ana Andrade', payerCpf: '52998224725',
    })
    expect(p.body).toBe('Recebi de Ana Andrade, CPF 529.982.247-25, a importância de R$ 300,00 referente a sessões de psicoterapia de Júlia Andrade nas datas:')
    expect(p.placeAndDate).toBe('[cidade], 9 de outubro de 2026.')
    const empty = documentPreview({ type: 'receipt', patientName: 'Júlia', city: 'Recife', sessionDates: [], today })
    expect(empty.body).toContain('Recebi de Júlia a importância de R$ [valor]')
  })
})

describe('erros da API', () => {
  const err = (statusCode: number) => ({ statusCode, data: { message: 'técnico' } })

  it('cada status da emissão tem texto próprio', () => {
    const texts = [400, 403, 404, 422, 503].map(s => apiErrorMessage(err(s), GENERATE_DOCUMENT_ERRORS))
    expect(new Set(texts).size).toBe(5)
    expect(texts.join(' ')).not.toContain('técnico')
    // Conta em modo só leitura: o texto padrão manda para Assinatura.
    expect(apiErrorMessage(err(402), GENERATE_DOCUMENT_ERRORS)).toContain(READ_ONLY_MESSAGE)
  })

  it('link: 409 diz que o PDF ainda não está pronto', () => {
    expect(apiErrorMessage(err(409), DOCUMENT_LINK_ERRORS)).toContain('ainda não está pronto')
    expect(apiErrorMessage(err(404), DOCUMENT_LINK_ERRORS)).not.toBe(apiErrorMessage(err(503), DOCUMENT_LINK_ERRORS))
  })
})
