import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodPtBrErrorMap } from '~/utils/zod-pt-br'
import {
  activityTemplateDetailSchema,
  templateFieldInputSchema,
  templateRequestSchema,
} from '~/schemas/activity-template'
import {
  emptyField,
  fieldsAreUntouchedPreset,
  filterTemplates,
  summarizeFields,
  templateApiErrorMessage,
  templateTypePreset,
  templateOriginLabel,
  templateToFormValues,
} from '~/utils/activity-template'

z.setErrorMap(zodPtBrErrorMap)

const firstMessage = (result: z.SafeParseReturnType<unknown, unknown>) =>
  result.success ? '' : result.error.issues[0]?.message
const firstPath = (result: z.SafeParseReturnType<unknown, unknown>) =>
  result.success ? '' : result.error.issues[0]?.path.join('.')

const validRequest = {
  title: 'Registro de pensamentos',
  typeCode: 'record',
  fields: [
    { label: 'Descreva a situação', fieldType: 'long_text', required: true },
    { label: 'Intensidade', fieldType: 'scale', required: true, min: '1', max: '10' },
    { label: 'Distorções', fieldType: 'multiple_choice', required: false, options: ['Catastrofização', 'Leitura mental'] },
  ],
}

describe('templateRequestSchema', () => {
  it('aceita o corpo válido e converte números vindos de inputs de texto', () => {
    const parsed = templateRequestSchema.parse(validRequest)
    expect(parsed.fields[1]).toMatchObject({ min: 1, max: 10 })
    expect(parsed.description).toBeUndefined()
  })

  it('mensagens em português para título, tipo e campos', () => {
    expect(firstMessage(templateRequestSchema.safeParse({ ...validRequest, title: 'a' }))).toBe('Informe um título com pelo menos 2 caracteres')
    expect(firstMessage(templateRequestSchema.safeParse({ ...validRequest, typeCode: 'x' }))).toBe('Selecione o tipo base')
    expect(firstMessage(templateRequestSchema.safeParse({ ...validRequest, fields: [] }))).toBe('Adicione pelo menos um campo')
  })
})

describe('templateFieldInputSchema', () => {
  const field = (over: Record<string, unknown>) => templateFieldInputSchema.safeParse({
    label: 'Pergunta', fieldType: 'boolean', required: true, ...over,
  })

  it('exige pergunta e tipo conhecido', () => {
    expect(firstMessage(field({ label: '  ' }))).toBe('Informe a pergunta')
    expect(firstMessage(field({ fieldType: 'file' }))).toBe('Selecione o tipo de resposta')
  })

  it('escala precisa de mínimo menor que máximo e até 100 pontos', () => {
    expect(firstMessage(field({ fieldType: 'scale', max: 10 }))).toBe('Informe o mínimo')
    expect(firstMessage(field({ fieldType: 'scale', min: 10, max: 1 }))).toBe('O máximo deve ser maior que o mínimo')
    expect(firstMessage(field({ fieldType: 'scale', min: 0, max: 101 }))).toBe('A escala pode ter no máximo 100 pontos')
    expect(field({ fieldType: 'scale', min: '1', max: '5' }).success).toBe(true)
  })

  it('escolhas precisam de 2 opções, sem vazias nem repetidas', () => {
    expect(firstMessage(field({ fieldType: 'single_choice', options: ['A'] }))).toBe('Informe pelo menos 2 opções')
    const blank = field({ fieldType: 'multiple_choice', options: ['A', ' '] })
    expect(firstMessage(blank)).toBe('Preencha ou remova esta opção')
    expect(firstPath(blank)).toBe('options.1')
    expect(firstMessage(field({ fieldType: 'multiple_choice', options: ['Outra', 'outra'] }))).toBe('Esta opção está repetida')
  })

  it('texto aceita tamanho vazio e rejeita fora da faixa', () => {
    expect(field({ fieldType: 'short_text', maxLength: '' }).success).toBe(true)
    expect(firstMessage(field({ fieldType: 'short_text', maxLength: 501 }))).toBe('Use um tamanho entre 1 e 500')
    expect(firstMessage(field({ fieldType: 'long_text', maxLength: 'abc' }))).toBe('Informe um número inteiro')
  })
})

describe('helpers do builder', () => {
  it('resume os campos como no card do design', () => {
    expect(summarizeFields([])).toBe('0 campos')
    expect(summarizeFields([], 1)).toBe('1 campo')
    expect(summarizeFields(['Descreva a situação', 'Qual foi o pensamento?', 'Emoção', 'Alternativa']))
      .toBe('4 campos · descreva a situação, qual foi o pensamento, emoção…')
  })

  it('origem do template', () => {
    expect(templateOriginLabel({ isGlobal: true, ownedByMe: false })).toBe('Acolhe')
    expect(templateOriginLabel({ isGlobal: false, ownedByMe: true })).toBe('Meu')
    expect(templateOriginLabel({ isGlobal: false, ownedByMe: false })).toBe('Da organização')
  })

  it('campo novo já vem com a configuração mínima do tipo', () => {
    expect(emptyField('scale')).toMatchObject({ min: 1, max: 10, required: true })
    expect(emptyField('single_choice').options).toEqual(['', ''])
    expect(emptyField('boolean')).toEqual({ label: '', fieldType: 'boolean', required: true })
  })

  it('converte o detalhe da API em valores do formulário', () => {
    const detail = activityTemplateDetailSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'RPD', type: 'record', description: null, instructions: 'Instrução',
      version: 2, isGlobal: false, ownedByMe: true, isArchived: false, superseded: false,
      editable: true, parentTemplateId: '22222222-2222-4222-8222-222222222222', assignmentCount: 0,
      fields: [{
        id: '33333333-3333-4333-8333-333333333333', code: 'situacao', label: 'Situação',
        fieldType: 'scale', displayOrder: 1, config: { required: false, min: 1, max: 5, minLabel: 'leve' },
      }],
      createdAt: '2026-09-09T12:00:00Z', updatedAt: '2026-09-09T12:00:00Z',
    })
    expect(templateToFormValues(detail)).toEqual({
      title: 'RPD', description: undefined, instructions: 'Instrução', typeCode: 'record',
      fields: [{
        label: 'Situação', fieldType: 'scale', required: false, helpText: undefined,
        maxLength: undefined, min: 1, max: 5, minLabel: 'leve', maxLabel: undefined, options: undefined,
      }],
    })
  })

  it('mostra a mensagem específica da API nos 400 e traduz os demais', () => {
    const err = (statusCode: number, message: string) => ({ statusCode, data: { message } })
    expect(templateApiErrorMessage(err(400, 'Campo 3: a escala precisa de valor mínimo e máximo'), 'x'))
      .toBe('Campo 3: a escala precisa de valor mínimo e máximo')
    expect(templateApiErrorMessage(err(400, 'corpo inválido'), 'x')).toBe('Confira os campos do template e tente de novo.')
    expect(templateApiErrorMessage(err(400, '[\n  {\n "code": "custom" }\n]'), 'x')).toBe('Confira os campos do template e tente de novo.')
    expect(templateApiErrorMessage(err(409, 'existe uma versão mais nova deste template'), 'x'))
      .toContain('versão mais nova')
    expect(templateApiErrorMessage(err(500, 'boom'), 'Não deu.')).toBe('Não deu.')
  })
})

describe('tipo base com consequência (ACO-74)', () => {
  it('sugere campos coerentes com cada tipo base', () => {
    expect(templateTypePreset('record')).toEqual([])

    const escala = templateTypePreset('scale')
    expect(escala).toHaveLength(1)
    expect(escala[0].fieldType).toBe('scale')
    expect(escala[0].min).toBe(1)
    expect(escala[0].max).toBe(10)

    const checklist = templateTypePreset('checklist')
    expect(checklist).toHaveLength(1)
    expect(checklist[0].fieldType).toBe('boolean')

    const checkin = templateTypePreset('checkin')
    expect(checkin).toHaveLength(1)
    expect(checkin[0].fieldType).toBe('scale')
    // mesma faixa do check-in de humor que a paciente já usa
    expect(checkin[0].max).toBe(5)
  })

  it('os presets passam na validação do template', () => {
    for (const type of ['scale', 'checklist', 'checkin'] as const) {
      const parsed = templateRequestSchema.safeParse({
        title: 'Teste', typeCode: type, fields: templateTypePreset(type),
      })
      expect(parsed.success, `preset de ${type} precisa ser válido`).toBe(true)
    }
  })

  it('reconhece lista vazia e preset intocado como substituíveis', () => {
    expect(fieldsAreUntouchedPreset([], 'scale')).toBe(true)
    expect(fieldsAreUntouchedPreset(templateTypePreset('scale'), 'scale')).toBe(true)
    expect(fieldsAreUntouchedPreset(templateTypePreset('checkin'), 'checkin')).toBe(true)
  })

  it('protege campos que a psicóloga já mexeu', () => {
    // Trocar o tipo base não pode apagar trabalho: basta um rótulo editado.
    const editado = templateTypePreset('scale').map((f) => ({ ...f, label: 'Minha pergunta' }))
    expect(fieldsAreUntouchedPreset(editado, 'scale')).toBe(false)

    const comCampoExtra = [...templateTypePreset('scale'), emptyField('long_text')]
    expect(fieldsAreUntouchedPreset(comCampoExtra, 'scale')).toBe(false)

    // Campo montado do zero num template "Formulário" também é trabalho.
    expect(fieldsAreUntouchedPreset([emptyField('short_text')], 'record')).toBe(false)
  })

  it('filtra a biblioteca por tipo base', () => {
    const lista = [
      { title: 'Diário', description: 'situação e pensamento', type: 'record' },
      { title: 'Humor', description: null, type: 'scale' },
      { title: 'Tarefas', description: null, type: 'checklist' },
    ]
    expect(filterTemplates(lista, { typeCode: 'scale' }).map((t) => t.title)).toEqual(['Humor'])
    expect(filterTemplates(lista, { typeCode: '' })).toHaveLength(3)
    expect(filterTemplates(lista, {})).toHaveLength(3)
  })

  it('combina busca e tipo', () => {
    const lista = [
      { title: 'Diário de humor', description: null, type: 'record' },
      { title: 'Escala de humor', description: null, type: 'scale' },
    ]
    expect(filterTemplates(lista, { search: 'humor' })).toHaveLength(2)
    expect(filterTemplates(lista, { search: 'humor', typeCode: 'scale' }).map((t) => t.title))
      .toEqual(['Escala de humor'])
    expect(filterTemplates(lista, { search: 'inexistente', typeCode: 'scale' })).toHaveLength(0)
  })

  it('busca também na descrição, ignorando maiúsculas', () => {
    const lista = [{ title: 'Diário', description: 'Situação e Pensamento', type: 'record' }]
    expect(filterTemplates(lista, { search: 'PENSAMENTO' })).toHaveLength(1)
    expect(filterTemplates(lista, { search: '  diário  ' })).toHaveLength(1)
  })
})
