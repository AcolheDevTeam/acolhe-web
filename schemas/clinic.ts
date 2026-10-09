import { z } from 'zod'

// Área da clínica (ACO-62; API: ADR 0002, fase 5). Só dados da equipe e números:
// nenhum dado de paciente chega aqui.
const workspaceRole = z.enum(['clinic_owner', 'clinic_admin', 'clinical_supervisor', 'psychologist'])

export const clinicTeamSchema = z.object({
  members: z.array(z.object({
    userId: z.string().uuid(),
    email: z.string(),
    fullName: z.string().nullable(),
    roles: z.array(workspaceRole),
    status: z.string(),
    startedAt: z.string().nullable(),
    suspendedAt: z.string().nullable(),
    endedAt: z.string().nullable(),
  })),
  invitations: z.array(z.object({
    id: z.string().uuid(),
    email: z.string(),
    roles: z.array(workspaceRole),
    expiresAt: z.string(),
    createdAt: z.string(),
  })),
})
export type ClinicTeam = z.infer<typeof clinicTeamSchema>
export type ClinicMember = ClinicTeam['members'][number]

export const clinicOverviewSchema = z.object({
  professionals: z.array(z.object({
    userId: z.string().uuid(),
    fullName: z.string(),
    membershipStatus: z.string(),
    activePatients: z.number().int(),
    sessionsLast30Days: z.number().int(),
    upcomingAppointments: z.number().int(),
  })),
})
export type ClinicOverview = z.infer<typeof clinicOverviewSchema>

export const clinicInvitationResultSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  roles: z.array(workspaceRole),
  expiresAt: z.string(),
  link: z.string(),
  deliveryStatus: z.enum(['sent', 'failed', 'disabled']),
})
export type ClinicInvitationResult = z.infer<typeof clinicInvitationResultSchema>

export const inviteMemberSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').transform(value => value.toLowerCase()),
  roles: z.array(workspaceRole).min(1, 'Escolha ao menos um papel.'),
}).strict()

export const membershipChangeSchema = z.object({
  userId: z.string().uuid(),
  change: z.enum(['suspend', 'reactivate', 'end']),
})
export const membershipChangeBodySchema = z.object({ reason: z.string().max(500).optional() }).strict()
