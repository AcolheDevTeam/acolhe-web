<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import type { BillingCycle, Plan } from '~/utils/plans'

// Cartão de plano (protótipo "Planos"): nome, público, preço do ciclo, lista do
// que inclui e a ação no rodapé (slot). O plano por psicóloga mostra a conta
// "N psicólogas × preço". `dark` é o bloco Noite usado no plano Clínica.
const { plan, cycle, seats = 1, dark = false } = defineProps<{
  plan: Plan
  cycle: BillingCycle
  seats?: number
  dark?: boolean
}>()

const effectiveCycle = computed(() => cycleFor(plan, cycle))
const unit = computed(() => plan.prices[effectiveCycle.value]?.monthlyCents ?? 0)
const totals = computed(() => planTotals(plan, cycle, seats))
const onlyMonthly = computed(() => cycle === 'annual' && effectiveCycle.value === 'monthly')
const priceNote = computed(() => {
  if (onlyMonthly.value) return 'por mês · só mensal'
  if (effectiveCycle.value === 'annual') return plan.perSeat ? 'por psicóloga por mês, cobrado por ano' : 'por mês, cobrado por ano'
  return plan.perSeat ? 'por psicóloga por mês' : 'por mês'
})
const titleId = useId()
</script>

<template>
  <section
    :aria-labelledby="titleId"
    :class="[
      'flex flex-col gap-5 rounded-2xl p-6',
      dark ? 'bg-brand text-brand-foreground' : 'border bg-card text-card-foreground',
    ]"
  >
    <div class="flex flex-col gap-1.5">
      <h3 :id="titleId" :class="['text-xl font-semibold tracking-[-0.02em]', dark && 'text-white']">{{ plan.name }}</h3>
      <p :class="['text-sm leading-relaxed', dark ? 'text-brand-muted' : 'text-muted-foreground']">{{ plan.audience }}</p>
    </div>

    <div aria-live="polite" class="flex flex-col gap-1">
      <p class="flex flex-wrap items-baseline gap-x-2">
        <span :class="['text-[34px] font-semibold leading-none tracking-[-0.03em]', dark && 'text-white']">{{ formatBRL(unit) }}</span>
        <span :class="['text-sm', dark ? 'text-brand-muted' : 'text-muted-foreground']">{{ priceNote }}</span>
      </p>
      <p v-if="plan.perSeat" :class="['font-mono text-[13px]', dark ? 'text-brand-foreground' : 'text-secondary-foreground']">
        {{ seats }} psicólogas × {{ formatBRL(unit) }} = {{ formatBRL(totals.monthlyCents) }} por mês
      </p>
      <p
        v-if="effectiveCycle === 'annual' && totals.annualTotalCents !== undefined"
        :class="['font-mono text-[13px]', dark ? 'text-brand-foreground' : 'text-secondary-foreground']"
      >
        {{ formatBRL(totals.annualTotalCents) }} por ano
      </p>
    </div>

    <ul class="flex flex-col gap-2.5 text-sm">
      <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2.5">
        <Check :class="['mt-0.5 size-4 shrink-0', dark ? 'text-highlight' : 'text-primary']" :stroke-width="2" aria-hidden="true" />
        <span>{{ feature }}</span>
      </li>
    </ul>

    <p v-if="plan.note" :class="['text-[13px] leading-relaxed', dark ? 'text-brand-muted' : 'text-muted-foreground']">{{ plan.note }}</p>

    <div class="mt-auto pt-1">
      <slot />
    </div>
  </section>
</template>
