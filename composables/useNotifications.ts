import type { NotificationPreference } from '~/schemas/notification'
import type { User } from '~/types'

// Caixa de notificações da psicóloga (ACO-99). As chaves levam a pessoa e a
// organização: cada espaço de trabalho tem a sua caixa e nenhum cache serve a
// outra conta (LGPD).

/**
 * Quem recebe notificações. `role` é o papel efetivo (a API usa
 * tenant.EffectiveRole): quem administra a clínica e também atende já chega
 * como 'psychologist'. Quem só administra não tem pacientes nem notificações.
 */
export function useHasNotifications() {
  const { data: me } = useNuxtData<User | null>('me')
  return computed(() => me.value?.role === 'psychologist')
}

export function useNotificationKeys() {
  const { data: me } = useNuxtData<User | null>('me')
  const organizationId = me.value?.workspace?.organizationId ?? me.value?.organizationId
  return {
    unread: notificationsKey('unread', me.value?.id, organizationId),
    list: notificationsKey('list', me.value?.id, organizationId),
  }
}

// Um único gancho de navegação por app, mesmo com dois sinos montados
// (sidebar e barra do celular): o contador é uma consulta só por troca de rota.
const navigationHooked = new WeakSet<object>()

/** Contador do sino, compartilhado entre os sinos e a página /notificacoes. */
export function useUnreadNotifications() {
  const enabled = useHasNotifications()
  const { unread: key } = useNotificationKeys()
  const { data, refresh } = useFetch<{ count: number }>('/api/notifications/unread-count', {
    key,
    default: () => ({ count: 0 }),
    immediate: enabled.value,
    // Montar a página e trocar de rota pedem a mesma contagem: a segunda
    // espera a primeira em vez de disparar outra.
    dedupe: 'defer',
    // Falha no contador não derruba a tela: o sino só fica sem número.
    onResponseError: () => {},
  })
  const nuxtApp = useNuxtApp()
  if (import.meta.client && enabled.value && !navigationHooked.has(nuxtApp)) {
    navigationHooked.add(nuxtApp)
    // Navegar é o momento natural de o contador mudar (abriu a revisão,
    // marcou na caixa); o custo é uma contagem indexada.
    useRouter().afterEach((to, from) => {
      if (to.path !== from.path) void refreshNuxtData(key)
    })
  }
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
