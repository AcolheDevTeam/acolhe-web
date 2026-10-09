import type { UserRole, WorkspaceContext, WorkspaceRole } from '~/types'

// Destinos por tipo de acesso (ADR 0002 da API): quem atende vai ao painel
// clínico; quem só administra a clínica vai à área da clínica; vínculo inativo
// vai à página que explica e oferece os outros workspaces.

type SessionUser = { role: UserRole, workspace?: WorkspaceContext } | null | undefined

export const INACTIVE_WORKSPACE_PATH = '/espaco-inativo'
export const CLINIC_HOME_PATH = '/clinica'

export function isClinicAdmin(user: SessionUser): boolean {
  const roles: WorkspaceRole[] = user?.workspace?.roles ?? []
  return roles.includes('clinic_owner') || roles.includes('clinic_admin')
}

export function homeFor(user: SessionUser): string {
  if (!user) return '/login'
  if (user.role === 'patient') return '/patient'
  if (user.workspace && !user.workspace.active) return INACTIVE_WORKSPACE_PATH
  if (user.role === 'org_admin') return CLINIC_HOME_PATH
  return '/dashboard'
}

export function workspaceTypeLabel(type: string): string {
  return type === 'clinic' ? 'Clínica' : 'Consultório'
}

export function workspaceRoleLabel(role: WorkspaceRole): string {
  return ({
    clinic_owner: 'Responsável',
    clinic_admin: 'Administração',
    clinical_supervisor: 'Supervisão clínica',
    psychologist: 'Psicóloga',
  } as Record<WorkspaceRole, string>)[role] ?? role
}
