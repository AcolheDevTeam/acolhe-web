import { describe, expect, it } from 'vitest'
import { documentaryDiff } from '../utils/documentary-diff'
import {
  notebookSchema,
  saveNotebookSchema,
  restoreNotebookSchema,
  documentaryPaginationSchema,
  documentaryPatientsSchema,
} from '../schemas/documentary'

describe('contratos do registro documental', () => {
  it('aceita timestamps da API com fuso e precisão de microssegundos', () => {
    expect(
      notebookSchema.safeParse({
        id: '11111111-1111-4111-8111-111111111111',
        patientId: '22222222-2222-4222-8222-222222222222',
        category: 'hypothesis',
        content: '',
        revision: 1,
        updatedAt: '2026-10-01T13:35:19.472915-03:00',
      }).success,
    ).toBe(true)
  })
  it('preserva texto vazio, espaços e Unicode no contrato de gravação', () => {
    for (const content of ['', '  Hipótese 📝\n\t '])
      expect(
        saveNotebookSchema.parse({ content, expectedRevision: 0 }).content,
      ).toBe(content)
    expect(
      saveNotebookSchema.safeParse({
        content: 'á'.repeat(100001),
        expectedRevision: 0,
      }).success,
    ).toBe(false)
  })
  it('rejeita autoria injetada, revisão ausente e paginação fora dos limites', () => {
    expect(
      saveNotebookSchema.safeParse({
        content: 'x',
        expectedRevision: 0,
        authorId: 'outra',
      }).success,
    ).toBe(false)
    expect(saveNotebookSchema.safeParse({ content: 'x' }).success).toBe(false)
    expect(
      restoreNotebookSchema.safeParse({ revision: 1, expectedRevision: 0 })
        .success,
    ).toBe(false)
    expect(documentaryPaginationSchema.safeParse({ page: 0 }).success).toBe(
      false,
    )
    expect(
      documentaryPaginationSchema.safeParse({ pageSize: 101 }).success,
    ).toBe(false)
  })
  it('exige os totais da API, inclusive em páginas vazias', () => {
    expect(
      documentaryPatientsSchema.parse({
        items: [],
        totalCount: 50,
        totalPages: 3,
        page: 4,
        pageSize: 20,
      }).totalCount,
    ).toBe(50)
    expect(documentaryPatientsSchema.safeParse({ items: [] }).success).toBe(
      false,
    )
  })
})
describe('comparação sem perder formatação', () => {
  it('representa inserção, remoção, limpeza e alterações Unicode', () => {
    for (const [before, after] of [
      ['Olá\nantes', 'Olá\ndepois'],
      ['', ' texto '],
      ['texto', ''],
      ['📝 teste', '📘 teste'],
      ['igual', 'igual'],
    ]) {
      const result = documentaryDiff(before!, after!)
      expect(result.prefix + result.removed + result.suffix).toBe(before)
      expect(result.prefix + result.added + result.suffix).toBe(after)
    }
  })
  it('compara textos extensos sem tabela quadrática', () => {
    const prefix = 'linha\n'.repeat(20000)
    const result = documentaryDiff(prefix + 'antes', prefix + 'depois')
    expect(result.prefix + result.added + result.suffix).toBe(prefix + 'depois')
  })
})
