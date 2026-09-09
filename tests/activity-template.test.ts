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
  summarizeFields,
  templateApiErrorMessage,
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
