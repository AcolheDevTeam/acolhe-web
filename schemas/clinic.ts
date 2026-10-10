import { z } from 'zod'
import { isValidCnpj, normalizeCnpj } from '~/utils/cnpj'

const invitationDeliveryStatus = z.enum(['sent', 'failed', 'disabled'])

export const adminOverviewSchema = z.object({
  activeAccounts: z.number().int().nonnegative(),
  trialingAccounts: z.number().int().nonnegative(),
  pastDueAccounts: z.number().int().nonnegative(),
  pendingClinicInvitations: z.number().int().nonnegative(),
})

export const adminAccountsQuerySchema = z.object({
  query: z.string().trim().max(200).optional(),
  type: z.enum(['individual', 'clinic']).optional(),
  status: z.enum(['trialing', 'active', 'past_due', 'canceled']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export const adminAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['individual', 'clinic']),
  cnpj: z.string().nullable(),
  ownerEmail: z.string().email().nullable(),
  subscriptionStatus: z.enum(['trialing', 'active', 'past_due', 'canceled']).nullable(),
  planCode: z.string().nullable(),
  billingCycle: z.string().nullable(),
  trialEndsAt: z.string().datetime().nullable(),
  currentPeriodEnd: z.string().datetime().nullable(),
  pastDueSince: z.string().datetime().nullable(),
  initialInvitationStatus: z.string().nullable(),
})

export const adminAccountsSchema = z.object({
  items: z.array(adminAccountSchema),
  total: z.number().int().nonnegative(),
})

export const createClinicSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da clínica.').max(160, 'O nome deve ter no máximo 160 caracteres.'),
  cnpj: z.string().transform(normalizeCnpj).refine(value => isValidCnpj(value), 'Informe um CNPJ válido.'),
  ownerEmail: z.string().trim().email('Informe um e-mail válido.').transform(value => value.toLowerCase()),
  ownerAttends: z.boolean(),
}).strict()

export const createClinicFormSchema = createClinicSchema.extend({
  cnpj: z.string().trim().min(1, 'Informe o CNPJ.').transform(normalizeCnpj).refine(value => isValidCnpj(value), 'Informe um CNPJ válido.'),
})

export const adminInvitationSchema = z.object({
  status: z.string(),
  ownerEmail: z.string().email(),
  expiresAt: z.string().datetime(),
  deliveryStatus: invitationDeliveryStatus.nullable(),
})

export const adminClinicMutationSchema = z.object({
  organizationId: z.string().uuid(),
  invitation: adminInvitationSchema.extend({ link: z.string().url() }),
})

export const cancelClinicSchema = z.object({
  reason: z.string().trim().min(5, 'Descreva o motivo do cancelamento.').max(500, 'O motivo deve ter no máximo 500 caracteres.'),
}).strict()

export type AdminOverview = z.infer<typeof adminOverviewSchema>
export type AdminAccount = z.infer<typeof adminAccountSchema>
export type AdminAccounts = z.infer<typeof adminAccountsSchema>
export type AdminInvitation = z.infer<typeof adminInvitationSchema>
export type CreateClinic = z.infer<typeof createClinicSchema>


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
