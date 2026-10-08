import { describe, expect, it } from 'vitest'
import { invitationLoadFailure } from '~/utils/invitation'

describe('falha ao carregar o convite (regra A6, resto do C8)', () => {
  it('inexistente, indisponível e erro nosso têm mensagens diferentes', () => {
    const mensagens = [404, 410, 500].map(status => invitationLoadFailure(status).message)
    expect(new Set(mensagens).size).toBe(3)
  })

  it('erro nosso não afirma que o link expirou ou foi usado', () => {
    for (const status of [500, 502, 503, undefined]) {
      const { message, canRetry } = invitationLoadFailure(status)
      expect(canRetry).toBe(true)
      for (const palavra of ['expirou', 'expirado', 'recusado', 'utilizado', 'usado']) {
        expect(message.toLowerCase()).not.toContain(palavra)
      }
    }
  })

  it('só o 410 fala em expirado, recusado ou utilizado', () => {
    expect(invitationLoadFailure(410).message).toContain('expirou')
    expect(invitationLoadFailure(410).canRetry).toBe(false)
    expect(invitationLoadFailure(404).canRetry).toBe(false)
  })
})
