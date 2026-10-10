import { describe, expect, it } from 'vitest'
import { adminAccountsSchema, adminOverviewSchema, createClinicFormSchema, cancelClinicSchema } from '~/schemas/clinic'
import { homeFor } from '~/utils/workspace'

describe('contratos do painel administrativo', () => {
  it('valida o resumo e mantém as quatro contagens separadas', () => {
    expect(adminOverviewSchema.parse({
      activeAccounts: 12,
      trialingAccounts: 4,
      pastDueAccounts: 2,
      pendingClinicInvitations: 3,
    })).toEqual({
      activeAccounts: 12,
      trialingAccounts: 4,
      pastDueAccounts: 2,
      pendingClinicInvitations: 3,
    })
  })

  it('aceita campos opcionais nulos na conta retornada pela API', () => {
    const parsed = adminAccountsSchema.parse({
      items: [{
        id: '6a93494a-d408-45c1-a243-58104eb9d9d3',
        name: 'Clínica Horizonte',
        type: 'clinic',
        cnpj: null,
        ownerEmail: null,
        subscriptionStatus: 'trialing',
        planCode: null,
        billingCycle: null,
        trialEndsAt: null,
        currentPeriodEnd: null,
        pastDueSince: null,
        initialInvitationStatus: null,
      }],
      total: 1,
    })
    expect(parsed.items[0]?.ownerEmail).toBeNull()
    expect(parsed.total).toBe(1)
  })

  it('normaliza CNPJ e e-mail e valida os dígitos do CNPJ', () => {
    expect(createClinicFormSchema.parse({
      name: 'Clínica Horizonte',
      cnpj: '11.222.333/0001-81',
      ownerEmail: 'DONA@EXAMPLE.COM',
      ownerAttends: true,
    })).toEqual({
      name: 'Clínica Horizonte',
      cnpj: '11222333000181',
      ownerEmail: 'dona@example.com',
      ownerAttends: true,
    })
    expect(createClinicFormSchema.safeParse({ name: 'Clínica', cnpj: '11.222.333/0001-80', ownerEmail: 'dona@example.com', ownerAttends: false }).success).toBe(false)
  })

  it('exige motivo útil para cancelar uma clínica', () => {
    expect(cancelClinicSchema.safeParse({ reason: 'Solicitação da responsável' }).success).toBe(true)
    expect(cancelClinicSchema.safeParse({ reason: '   ' }).success).toBe(false)
  })

  it('envia a equipe platform_admin para /admin', () => {
    expect(homeFor({ role: 'platform_admin' })).toBe('/admin')
  })
})
