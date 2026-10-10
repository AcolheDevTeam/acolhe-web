import { describe, expect, it } from 'vitest'
import { addReviewTag, normalizeTag, sameTags } from '../utils/review-tags'
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

  it('sem corpo vira revisão vazia', () => {
    expect(reviewRequestSchema.parse({})).toEqual({ tags: [] })
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
