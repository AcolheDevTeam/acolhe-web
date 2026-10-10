import type { ActiveSession, Profile } from '~/schemas/account-settings'
import type { User } from '~/types'

// Ajustes da conta (ACO-98). As chaves incluem o usuário: nenhum cache de uma
// conta pode servir a outra no mesmo navegador (LGPD).
export function profileKey(userId?: string | null): string {
  return `account-profile-${userId ?? 'none'}`
}

export function sessionsKey(userId?: string | null): string {
  return `account-sessions-${userId ?? 'none'}`
}

export function useProfile(options: { immediate?: boolean } = {}) {
  const { data: me } = useNuxtData<User | null>('me')
  return useFetch<Profile | null>('/api/me/profile', {
    key: profileKey(me.value?.id),
    default: () => null,
    immediate: options.immediate ?? true,
  })
}

export function useActiveSessions() {
  const { data: me } = useNuxtData<User | null>('me')
  return useFetch<ActiveSession[]>('/api/me/sessions', {
    key: sessionsKey(me.value?.id),
    default: () => [],
  })
}
