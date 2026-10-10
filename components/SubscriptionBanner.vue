<script setup lang="ts">
import { TriangleAlert } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { pastDueDaysLeft } from '~/utils/billing'

// Faixa de cobrança no topo do shell clínico (protótipo "Bloqueio"): aviso
// curto nos últimos dias do teste e faixa forte quando o workspace está só
// leitura. Paciente nunca vê (useSubscription não busca para ela). Na própria
// página de assinatura a faixa sairia repetida, então fica escondida.
const { subscription, enabled } = useSubscription()
const route = useRoute()
const onBillingPage = computed(() => route.path === BILLING_PATH)
const readOnly = computed(() => enabled.value && subscription.value?.writable === false)
const trialText = computed(() => enabled.value ? trialBannerText(subscription.value) : null)
const now = ref(new Date())
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => { clock = setInterval(() => { now.value = new Date() }, 60_000) })
onBeforeUnmount(() => clearInterval(clock))
const paymentDueDays = computed(() => {
  const sub = subscription.value
  if (!enabled.value || !sub?.writable || sub.status !== 'past_due' || !sub.pastDueSince) return null
  return pastDueDaysLeft(sub.pastDueSince, now.value)
})
</script>

<template>
  <template v-if="!onBillingPage">
    <div
      v-if="readOnly"
      role="status"
      class="sticky top-0 z-10 flex animate-fade flex-wrap items-center gap-x-5 gap-y-3 bg-alert px-4 py-3.5 text-white md:px-8 lg:px-12"
    >
      <TriangleAlert class="size-5 shrink-0" :stroke-width="1.9" aria-hidden="true" />
      <p class="min-w-0 flex-[1_1_280px] text-sm leading-normal">{{ READ_ONLY_MESSAGE }}</p>
      <Button as-child size="sm" variant="outline" class="border-0 bg-card text-warning hover:bg-warning-soft hover:text-warning">
        <NuxtLink :to="BILLING_PATH">Assinar</NuxtLink>
      </Button>
    </div>
    <div
      v-else-if="paymentDueDays !== null"
      role="status"
      class="flex animate-fade flex-wrap items-center gap-x-3 gap-y-1 bg-warning-soft px-4 py-2 text-[13px] text-warning md:px-8 lg:px-12"
    >
      <span>Pagamento atrasado. Regularize em {{ paymentDueDays }} {{ paymentDueDays === 1 ? 'dia' : 'dias' }} para manter o acesso de edição.</span>
      <span aria-hidden="true">·</span>
      <NuxtLink :to="BILLING_PATH" class="font-semibold underline underline-offset-[3px]">Ver cobrança</NuxtLink>
    </div>
    <div
      v-else-if="trialText"
      role="status"
      class="flex animate-fade flex-wrap items-center gap-x-3 gap-y-1 bg-warning-soft px-4 py-2 text-[13px] text-warning md:px-8 lg:px-12"
    >
      <span>{{ trialText }}</span>
      <span aria-hidden="true">·</span>
      <NuxtLink :to="BILLING_PATH" class="font-semibold underline underline-offset-[3px]">Assinar</NuxtLink>
    </div>
  </template>
</template>
