import { describe, expect, it } from 'vitest'
import { addReviewTag, codePointLength, hasHiddenChars, normalizeTag, sameTags } from '../utils/review-tags'
import { isReviewVersionConflict, REVIEW_CONFLICT_MESSAGE, reviewErrorMessage } from '../utils/review-errors'
import { reviewRequestSchema } from '../schemas/activity'
import { patientActivityDetailSchema, patientSubmittedActivitySchema } from '../schemas/patient-activity'

describe('tags da revisão', () => {
  it('apara e junta espaços', () => {
    expect(normalizeTag('  Trabalho   em  equipe ')).toBe('Trabalho em equipe')
  })

  it('ignora vazia e repetida, sem diferenciar caixa', () => {
    expect(addReviewTag(['Sono'], '   ')).toEqual({ tags: ['Sono'], error: null })
    expect(addReviewTag(['Sono'], ' sono ')).toEqual({ tags: ['Sono'], error: null })
    expect(addReviewTag(['Sono'], 'Trabalho')).toEqual({ tags: ['Sono', 'Trabalho'], error: null })
  })

  it('recusa tag longa e passar do limite com mensagem em português', () => {
    expect(addReviewTag([], 'x'.repeat(33)).error).toBe('Cada tag pode ter até 32 caracteres.')
    const ten = Array.from({ length: 10 }, (_, i) => `t${i}`)
    expect(addReviewTag(ten, 'nova').error).toBe('Use no máximo 10 tags por atividade.')
  })

  it('conta tamanho em code points, como a API', () => {
    expect(codePointLength('\u{1F600}'.repeat(32))).toBe(32)
    expect(addReviewTag([], '\u{1F600}'.repeat(32)).error).toBeNull()
    expect(addReviewTag([], '\u{1F600}'.repeat(33)).error).toBe('Cada tag pode ter até 32 caracteres.')
  })

  it('tag com caractere oculto ou quebra de linha é recusada', () => {
    expect(hasHiddenChars('a\nb', true)).toBe(false)
    expect(hasHiddenChars('a\nb', false)).toBe(true)
    expect(addReviewTag([], 'So\u200Bno').error).toBe('As tags não podem ter caracteres invisíveis, de controle ou quebra de linha.')
  })

  it('compara listas na ordem', () => {
    expect(sameTags(['a', 'b'], ['a', 'b'])).toBe(true)
    expect(sameTags(['a', 'b'], ['b', 'a'])).toBe(false)
  })
})

describe('corpo da revisão (BFF)', () => {
  it('comentário exige visibilidade', () => {
    const result = reviewRequestSchema.safeParse({ comment: 'Bom trabalho', tags: [] })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Escolha se o comentário é compartilhado com a paciente ou interno.')
  })

  it('sem corpo continua vazio (a API só marca como revisada e mantém o que existe)', () => {
    expect(reviewRequestSchema.parse({})).toEqual({})
  })

  it('leva a versão lida para a concorrência otimista', () => {
    expect(reviewRequestSchema.parse({ tags: [], expectedUpdatedAt: '2026-10-10T14:25:31.123456Z' }))
      .toEqual({ tags: [], expectedUpdatedAt: '2026-10-10T14:25:31.123456Z' })
    expect(reviewRequestSchema.safeParse({ tags: [], expectedUpdatedAt: 'ontem' }).success).toBe(false)
  })

  it('recusa caracteres invisíveis com a mensagem da regra', () => {
    const bidi = reviewRequestSchema.safeParse({ comment: 'ok \u202Etxt', visibility: 'shared' })
    expect(bidi.error?.issues[0]?.message).toBe('O comentário tem caracteres invisíveis ou de controle. Apague-os e tente de novo.')
    expect(reviewRequestSchema.safeParse({ comment: 'a\u0000b', visibility: 'shared' }).success).toBe(false)
    expect(reviewRequestSchema.safeParse({ tags: ['So\u200Bno'] }).success).toBe(false)
    expect(reviewRequestSchema.safeParse({ comment: 'linha 1\nlinha 2 \u{1F469}\u200D\u{1F4BB}', visibility: 'shared' }).success).toBe(true)
  })

  it('aceita comentário interno com tags', () => {
    expect(reviewRequestSchema.parse({ comment: ' nota ', visibility: 'private', tags: ['Sono'] }))
      .toEqual({ comment: 'nota', visibility: 'private', tags: ['Sono'] })
  })

  it('recusa visibilidade desconhecida e tags demais', () => {
    expect(reviewRequestSchema.safeParse({ comment: 'x', visibility: 'internal' }).success).toBe(false)
    expect(reviewRequestSchema.safeParse({ tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).success).toBe(false)
  })
})

describe('portal da paciente', () => {
  it('detalhe da API anterior ganha respostas vazias e sem comentário', () => {
    const detail = patientActivityDetailSchema.parse({
      id: '7b0f2f7e-4a43-4c6b-9c0f-111111111111', status: 'submitted', title: 'Registro',
      type: 'record', description: null, instructions: null, templateVersion: 1,
      scheduledFor: null, dueAt: null, submittedAt: '2026-10-06T12:00:00Z', canRespond: false, fields: [],
    })
    expect(detail.answers).toEqual([])
    expect(detail.comment).toBeNull()
    expect(detail.reviewedAt).toBeNull()
  })

  it('item enviado não carrega tags nem comentário interno', () => {
    const parsed = patientSubmittedActivitySchema.parse({
      id: '7b0f2f7e-4a43-4c6b-9c0f-111111111111', title: 'Registro', status: 'reviewed',
      submittedAt: '2026-10-06T12:00:00Z', reviewedAt: '2026-10-07T12:00:00Z',
      comment: { text: 'Retorno', updatedAt: '2026-10-07T12:00:00Z' },
      tags: ['não deveria passar'],
    })
    expect(parsed).not.toHaveProperty('tags')
  })
})

describe('aba Enviadas', async () => {
  const { formatDayMonth, submittedStatusMeta, patientActivitiesTab } = await import('../utils/patient-submitted')

  it('data curta no fuso do app', () => {
    expect(formatDayMonth('2026-10-06T15:00:00Z')).toBe('6 out')
    // 01:00 UTC ainda é o dia anterior no fuso do app.
    expect(formatDayMonth('2026-10-07T01:00:00Z')).toBe('6 out')
    expect(formatDayMonth(null)).toBe('—')
  })

  it('status e aba', () => {
    expect(submittedStatusMeta('reviewed').label).toBe('Revisada')
    expect(submittedStatusMeta('submitted').label).toBe('Aguardando revisão')
    expect(patientActivitiesTab('enviadas')).toBe('enviadas')
    expect(patientActivitiesTab('qualquer')).toBe('pendentes')
  })
})

describe('erros da revisão', () => {
  const relayed = (statusCode: number, message: string) => ({ statusCode, data: { data: { message } } })

  it('400 da API vira a frase da lista fechada', () => {
    expect(reviewErrorMessage(relayed(400, 'cada tag pode ter até 32 caracteres'))).toBe('Cada tag pode ter até 32 caracteres.')
    expect(reviewErrorMessage(relayed(400, 'o comentário tem caracteres invisíveis ou de controle; apague-os e tente de novo')))
      .toBe('O comentário tem caracteres invisíveis ou de controle. Apague-os e tente de novo.')
  })

  it('400 desconhecido não mostra o texto técnico', () => {
    expect(reviewErrorMessage(relayed(400, 'corpo inválido'))).toBe('Confira o comentário e as tags: algum passou do limite.')
  })

  it('409 de versão é diferente do 409 de status', () => {
    const version = relayed(409, 'a revisão foi alterada em outra aba ou dispositivo; recarregue para ver a versão atual')
    expect(isReviewVersionConflict(version)).toBe(true)
    expect(reviewErrorMessage(version)).toBe(REVIEW_CONFLICT_MESSAGE)
    const status = relayed(409, 'atividade precisa estar submetida para revisão')
    expect(isReviewVersionConflict(status)).toBe(false)
    expect(reviewErrorMessage(status)).toBe('Esta atividade não está mais aguardando revisão. Recarregue a página.')
  })
})
