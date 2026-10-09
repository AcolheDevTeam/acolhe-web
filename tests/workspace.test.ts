import { describe, expect, it } from 'vitest'
import { homeFor, isClinicAdmin, workspaceRoleLabel } from '../utils/workspace'

const clinic = (roles: string[], active = true) => ({ organizationId: 'org', type: 'clinic', roles: roles as never, active })

describe('destino por tipo de acesso (ADR 0002)', () => {
  it('paciente vai ao portal', () => {
    expect(homeFor({ role: 'patient' })).toBe('/patient')
  })
  it('quem atende vai ao painel clínico, mesmo sendo dona', () => {
    expect(homeFor({ role: 'psychologist', workspace: clinic(['clinic_owner', 'psychologist']) })).toBe('/dashboard')
  })
  it('quem só administra vai à área da clínica', () => {
    expect(homeFor({ role: 'org_admin', workspace: clinic(['clinic_admin']) })).toBe('/clinica')
  })
  it('vínculo inativo vai à página que explica', () => {
    expect(homeFor({ role: 'psychologist', workspace: clinic(['psychologist'], false) })).toBe('/espaco-inativo')
  })
  it('sem sessão vai ao login', () => {
    expect(homeFor(null)).toBe('/login')
  })
  it('administração da clínica é por papel do vínculo, não pelo papel efetivo', () => {
    expect(isClinicAdmin({ role: 'psychologist', workspace: clinic(['clinic_owner', 'psychologist']) })).toBe(true)
    expect(isClinicAdmin({ role: 'psychologist', workspace: clinic(['psychologist']) })).toBe(false)
    expect(isClinicAdmin({ role: 'org_admin', workspace: { ...clinic(['clinic_admin']), type: 'individual' } })).toBe(false)
  })
  it('rótulos dos papéis em português', () => {
    expect(workspaceRoleLabel('clinic_owner')).toBe('Responsável')
  })
})
