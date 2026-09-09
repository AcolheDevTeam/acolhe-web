import { describe, expect, it } from 'vitest'
import {
  authRedirect,
  logoutRedirect,
  patientPortalCacheKey,
  patientRedirect,
  sessionExpired,
} from '~/utils/patient-portal'

describe('proteções da área do paciente', () => {
  it('redireciona cada papel para sua área', () => {
    expect(patientRedirect('patient')).toBe('/patient')
    expect(patientRedirect('psychologist')).toBe('/dashboard')
    expect(patientRedirect(null)).toBe('/login')
  })

  it('protege rotas autenticadas de usuários anônimos', () => {
    expect(authRedirect(null)).toBe('/login')
    expect(authRedirect({ role: 'patient' })).toBeUndefined()
  })

  it('trata 401 como sessão expirada e logout volta ao login', () => {
    expect(sessionExpired({ statusCode: 401 })).toBe(true)
    expect(sessionExpired({ statusCode: 403 })).toBe(false)
    expect(logoutRedirect()).toBe('/login')
  })

  it('separa o cache por identidade e não usa chave anônima', () => {
    expect(patientPortalCacheKey()).toBe('patient-portal-pending')
    expect(patientPortalCacheKey('patient-a')).not.toBe(patientPortalCacheKey('patient-b'))
  })
})
