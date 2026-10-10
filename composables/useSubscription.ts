import type { Subscription } from '~/schemas/billing'
import type { User } from '~/types'

// Assinatura do workspace ativo (ACO-95). A chave inclui a organização: a troca
// de workspace recarrega a página, mas nenhum cache de uma organização pode
// servir à outra (LGPD). Paciente não busca nada.
export function useSubscription() {
  const { data: me } = useNuxtData<User | null>('me')
  const enabled = computed(() => hasBilling(me.value))
  const key = computed(() => subscriptionKey(me.value?.workspace?.organizationId))
  const { data: subscription, status, error, refresh } = useFetch<Subscription | null>('/api/billing/subscription', {
    key: key.value,
    default: () => null,
    immediate: enabled.value,
  })
  return { subscription, status, error, refresh, enabled, key }
}
