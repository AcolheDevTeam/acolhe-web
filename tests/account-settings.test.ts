import { describe, expect, it } from 'vitest'
import { activeSessionSchema, changePasswordSchema, profileUpdateSchema } from '../schemas/account-settings'
import { describeDevice, lastSeenLabel, networkLabel, sessionMeta } from '../utils/account-sessions'
import { profileKey, sessionsKey } from '../composables/useAccountSettings'

const valid = { fullName: ' Mariana Sá ', socialName: '', phone: '(11) 98765-4321', approach: 'TCC', defaultSessionMinutes: 50 }

describe('perfil da psicóloga (ACO-98)', () => {
  it('normaliza e aceita o perfil', () => {
    const parsed = profileUpdateSchema.parse(valid)
    expect(parsed.fullName).toBe('Mariana Sá')
    expect(parsed.phone).toBe('(11) 98765-4321')
  })

  it('recusa com mensagens em português', () => {
    const blank = profileUpdateSchema.safeParse({ ...valid, fullName: '   ' })
    expect(blank.success).toBe(false)
    expect(blank.error?.issues[0]?.message).toBe('Informe o nome completo.')
    const phone = profileUpdateSchema.safeParse({ ...valid, phone: '123' })
    expect(phone.error?.issues[0]?.message).toBe('Informe um telefone válido, com DDD.')
    expect(profileUpdateSchema.safeParse({ ...valid, defaultSessionMinutes: 5 }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ ...valid, defaultSessionMinutes: 600 }).success).toBe(false)
  })

  it('telefone e nome social são opcionais', () => {
    expect(profileUpdateSchema.safeParse({ fullName: 'Mariana', defaultSessionMinutes: 45 }).success).toBe(true)
  })
})

describe('troca de senha logada (ACO-98)', () => {
  it('exige a senha atual e aplica a regra única à nova', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'senha-nova-1' }).success).toBe(true)
    expect(changePasswordSchema.safeParse({ currentPassword: '', newPassword: 'senha-nova-1' }).error?.issues[0]?.message).toBe('Informe a senha atual.')
    expect(changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'curta' }).success).toBe(false)
    expect(changePasswordSchema.safeParse({ currentPassword: 'x', newPassword: 'é'.repeat(37) }).success).toBe(false)
  })
})

describe('sessões ativas (ACO-98)', () => {
  it('descreve navegador, sistema e tipo de aparelho', () => {
    expect(describeDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'))
      .toEqual({ label: 'Chrome no macOS', kind: 'desktop' })
    expect(describeDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'))
      .toEqual({ label: 'Safari no iPhone', kind: 'phone' })
    expect(describeDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0'))
      .toEqual({ label: 'Edge no Windows', kind: 'desktop' })
    expect(describeDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'))
      .toEqual({ label: 'Chrome no Android', kind: 'phone' })
    expect(describeDevice('').label).toBe('Navegador não identificado')
  })

  it('mostra só a rede do IP', () => {
    expect(networkLabel('189.40.12.0/24')).toBe('rede 189.40.12.x')
    expect(networkLabel('2804:14c:5b::/48')).toBe('rede 2804:14c:5b::')
    expect(networkLabel('')).toBe('')
  })

  it('formata o último uso', () => {
    const now = new Date('2026-10-10T12:00:00Z')
    expect(lastSeenLabel('2026-10-10T11:58:00Z', now)).toBe('ativa agora')
    expect(lastSeenLabel('2026-10-10T11:40:00Z', now)).toBe('ativa há 20 min')
    expect(lastSeenLabel('2026-10-10T10:00:00Z', now)).toBe('ativa há 2 horas')
    expect(lastSeenLabel('2026-10-07T12:00:00Z', now)).toBe('ativa há 3 dias')
    expect(sessionMeta({ ipPrefix: '189.40.12.0/24', lastSeenAt: '2026-10-07T12:00:00Z', current: true }, now)).toBe('rede 189.40.12.x · ativa agora')
  })

  it('valida a resposta da API e separa o cache por usuário', () => {
    expect(activeSessionSchema.safeParse({
      id: '8f2c2c39-56a8-4d47-9e0c-1b8d2a3c4d5e', userAgent: '', ipPrefix: '',
      startedAt: '2026-10-10T12:00:00Z', lastSeenAt: '2026-10-10T12:00:00-03:00', current: true,
    }).success).toBe(true)
    expect(profileKey('a')).not.toBe(profileKey('b'))
    expect(sessionsKey('a')).not.toBe(sessionsKey('b'))
  })
})
