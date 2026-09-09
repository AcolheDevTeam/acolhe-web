import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zodPtBrErrorMap } from '~/utils/zod-pt-br'
import { apiErrorMessage } from '~/utils/api-error'

z.setErrorMap(zodPtBrErrorMap)

const first = (result: z.SafeParseReturnType<unknown, unknown>) =>
  result.success ? '' : result.error.issues[0]?.message

describe('mensagens do Zod em português', () => {
  it('campo ausente e string vazia viram "Campo obrigatório"', () => {
    expect(first(z.object({ nome: z.string() }).safeParse({}))).toBe('Campo obrigatório')
    expect(first(z.string().min(1).safeParse(''))).toBe('Campo obrigatório')
  })

  it('formatos comuns', () => {
    expect(first(z.string().email().safeParse('x'))).toBe('Informe um e-mail válido')
    expect(first(z.string().uuid().safeParse('x'))).toBe('Selecione uma opção válida')
    expect(first(z.string().datetime().safeParse('x'))).toBe('Informe uma data e hora válidas')
    expect(first(z.string().date().safeParse('x'))).toBe('Informe uma data válida')
  })

  it('tamanhos', () => {
    expect(first(z.string().min(8).safeParse('abc'))).toBe('Informe pelo menos 8 caracteres')
    expect(first(z.string().max(3).safeParse('abcd'))).toBe('Use no máximo 3 caracteres')
    expect(first(z.array(z.string()).min(1).safeParse([]))).toBe('Selecione pelo menos um item')
    expect(first(z.number().min(1).safeParse(0))).toBe('O valor mínimo é 1')
  })

  it('mensagem própria do schema tem prioridade', () => {
    expect(first(z.string().min(2, 'Informe o nome completo').safeParse('a'))).toBe('Informe o nome completo')
  })
})

describe('apiErrorMessage', () => {
  const err = (statusCode: number, message = 'técnico') => ({ statusCode, data: { message } })

  it('usa o texto do contexto quando existe e o padrão quando não', () => {
    expect(apiErrorMessage(err(403), { 403: 'Vínculo não ativo.' })).toBe('Vínculo não ativo.')
    expect(apiErrorMessage(err(403))).toBe('Você não tem permissão para esta ação.')
    expect(apiErrorMessage(err(401))).toContain('Sua sessão expirou')
  })

  it('erro de servidor cai no default do contexto, nunca na mensagem técnica', () => {
    const msg = apiErrorMessage(err(500, 'falha ao criar paciente'), { default: 'Não deu agora.' })
    expect(msg).toBe('Não deu agora.')
    expect(apiErrorMessage(err(503))).toContain('indisponível')
  })

  it('sem status significa sem rede', () => {
    expect(apiErrorMessage(new TypeError('Failed to fetch'))).toContain('Sem conexão')
  })

  it('lê o status também de erros do ofetch com response', () => {
    expect(apiErrorMessage({ response: { status: 404 } })).toContain('Não encontramos')
  })
})
