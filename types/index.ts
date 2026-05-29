export type UserRole = 'platform_admin' | 'org_admin' | 'psychologist' | 'patient'

export interface User {
  id: string
  email: string
  role: UserRole
  organizationId: string | null
}

export interface Organization {
  id: string
  name: string
  slug: string
}

export interface Patient {
  id: string
  fullName: string
  status: string
  createdAt: string
}
