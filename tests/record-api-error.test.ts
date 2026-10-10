import { describe, expect, it } from 'vitest'
import { apiErrorInfo } from '../utils/api-error'

describe('apiErrorInfo com erro repassado pelo BFF', () => {
  it('lê a frase da API em data.data.message, mesmo com data.message vazio', () => {
    const error = { statusCode: 400, data: { statusCode: 400, message: '', data: { message: 'o campo Conduta passa do limite de 10.000 caracteres' } } }
    expect(apiErrorInfo(error)).toEqual({ status: 400, technical: 'o campo Conduta passa do limite de 10.000 caracteres' })
  })

  it('cai para as outras mensagens quando não há frase repassada', () => {
    expect(apiErrorInfo({ statusCode: 500, data: { message: '' }, statusMessage: 'Server Error' }).technical).toBe('Server Error')
  })
})
