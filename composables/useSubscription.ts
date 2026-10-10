import type { BillingDetails, Subscription } from '~/schemas/billing'
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

// Cartão, faturas e cancelamento agendado; só para quem gerencia a cobrança
// e tem assinatura paga. Falha aqui não derruba a página.
export function useBillingDetails(enabled: MaybeRefOrGetter<boolean>) {
  const { data: me } = useNuxtData<User | null>('me')
  const key = `billing-details-${me.value?.workspace?.organizationId ?? 'none'}`
  const result = useFetch<BillingDetails | null>('/api/billing/details', {
    key,
    default: () => null,
    immediate: toValue(enabled),
    watch: false,
  })
  // Assinatura que vira paga depois (retorno do checkout) passa a buscar.
  watch(() => toValue(enabled), (on) => { if (on && !result.data.value) void result.refresh() })
  return result
}
