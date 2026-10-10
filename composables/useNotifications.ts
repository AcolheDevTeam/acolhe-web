import type { NotificationPreference } from '~/schemas/notification'
import type { User } from '~/types'

// Caixa de notificações da psicóloga (ACO-99). As chaves levam a organização:
// cada espaço de trabalho tem a sua caixa e nenhum cache serve ao outro (LGPD).

/** Só quem atende recebe notificações; paciente e quem só administra, não. */
export function useHasNotifications() {
  const { data: me } = useNuxtData<User | null>('me')
  return computed(() => me.value?.role === 'psychologist')
}

/** Contador do sino, compartilhado entre o sino e a página /notificacoes. */
export function useUnreadNotifications() {
  const { data: me } = useNuxtData<User | null>('me')
  const enabled = useHasNotifications()
  const { data, refresh } = useFetch<{ count: number }>('/api/notifications/unread-count', {
    key: unreadKey(me.value?.workspace?.organizationId ?? me.value?.organizationId),
    default: () => ({ count: 0 }),
    immediate: enabled.value,
    // Falha no contador não derruba a tela: o sino só fica sem número.
    onResponseError: () => {},
  })
  const count = computed(() => data.value?.count ?? 0)
  return { count, refresh, enabled }
}

export function useNotificationPreferences() {
  const { data: me } = useNuxtData<User | null>('me')
  return useFetch<{ preferences: NotificationPreference[] }>('/api/notifications/preferences', {
    key: `notification-preferences-${me.value?.id ?? 'none'}`,
    default: () => ({ preferences: [] }),
  })
}
