import type { UserRole } from '~/types'

export function patientPortalCacheKey(patientId?: string | null): string {
  return `patient-portal-${patientId ?? 'pending'}`
}

export function patientRedirect(role?: UserRole | null): string {
  if (role === 'patient') return '/patient'
  if (role) return '/dashboard'
  return '/login'
}

export function authRedirect(user: { role: UserRole } | null | undefined): string | undefined {
  return user ? undefined : '/login'
}

export function sessionExpired(error: { statusCode?: number } | null | undefined): boolean {
  return error?.statusCode === 401
}

export function logoutRedirect(): string {
  return '/login'
}
