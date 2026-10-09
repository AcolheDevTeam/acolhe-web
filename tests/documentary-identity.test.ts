import { describe, expect, it } from 'vitest'
import {
  nextDocumentaryIdentity,
  unknownDocumentaryIdentity,
} from '../utils/documentary-identity'

const ana = { id: 'u-ana', organizationId: 'org-1' }
const bia = { id: 'u-bia', organizationId: 'org-1' }

describe('identidade do registro documental (ACO-77)', () => {
  it('reconhece a primeira pessoa válida', () => {
    expect(nextDocumentaryIdentity(unknownDocumentaryIdentity, ana)).toBe('org-1:u-ana')
  })

  it('mantém a identidade quando /me falha ou a sessão expira', () => {
    expect(nextDocumentaryIdentity('org-1:u-ana', null)).toBe('org-1:u-ana')
    expect(nextDocumentaryIdentity('org-1:u-ana', undefined)).toBe('org-1:u-ana')
  })

  it('mantém a identidade quando a mesma pessoa entra de novo', () => {
    expect(nextDocumentaryIdentity('org-1:u-ana', ana)).toBe('org-1:u-ana')
  })

  it('troca a identidade quando outra pessoa entra no mesmo navegador', () => {
    expect(nextDocumentaryIdentity('org-1:u-ana', bia)).toBe('org-1:u-bia')
  })

  it('distingue a mesma pessoa em outra organização', () => {
    expect(nextDocumentaryIdentity('org-1:u-ana', { ...ana, organizationId: 'org-2' })).toBe('org-2:u-ana')
  })

  it('aceita psicóloga sem organização', () => {
    expect(nextDocumentaryIdentity(unknownDocumentaryIdentity, { id: 'u-ana', organizationId: null })).toBe(':u-ana')
  })
})
