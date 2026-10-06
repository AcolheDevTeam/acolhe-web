import type { UserRole } from '~/types'

export function patientPortalCacheKey(patientId?: string | null): string {
  return `patient-portal-${patientId ?? 'pending'}`
}

export function patientRedirect(role?: UserRole | null): string {
  if (role === 'patient') return '/patient'
  if (role) return '/dashboard'
  return '/login'
}

export function authRedirect(user: { role: UserRole, nextStep?: string } | null | undefined): string | undefined {
  if (!user) return '/login'
  // Conta com e-mail pendente só anda depois de confirmar (ACO-63).
  if (user.nextStep === 'verify_email') return '/verify-email'
  return undefined
}

export function sessionExpired(error: { statusCode?: number } | null | undefined): boolean {
  return error?.statusCode === 401
}

export function logoutRedirect(): string {
  return '/login'
}
