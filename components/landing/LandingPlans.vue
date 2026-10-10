<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { BillingCycle, PlanCode } from '~/utils/plans'
import { FOUNDERS_LIMIT, PLANS, TRIAL_DAYS } from '~/utils/plans'
import { contactHref, maxAnnualDiscount, planDisplay } from '~/utils/landing'

// Planos da landing, no layout do protótipo "Planos": cards brancos e o
// Autônomo em Noite (a Clínica ainda não tem contratação aberta). Tudo vem de utils/plans.ts; nada de preço escrito aqui.
const cycle = ref<BillingCycle>('monthly')
const discount = maxAnnualDiscount(PLANS)
const cycleOptions = [
  { value: 'monthly' as const, label: 'Mensal' },
  { value: 'annual' as const, label: discount ? `Anual · até ${discount}% menos` : 'Anual' },
]

// Destaque visual: o plano padrão de quem atende sozinha (não é "mais escolhido").
const FEATURED: PlanCode = 'autonomo'
const order: PlanCode[] = ['autonomo', 'fundador', 'clinica']
const plans = computed(() => order
  .map(code => PLANS.find(plan => plan.code === code))
  .filter(plan => !!plan)
  .map(plan => ({ plan, view: planDisplay(plan, cycle.value) })))

const contactEmail = useRuntimeConfig().public.contactEmail as string | undefined
const clinicContact = contactHref(contactEmail, 'Plano Clínica do Acolhe')
</script>

<template>
  <div class="flex flex-col items-center gap-10">
    <div data-reveal class="flex flex-col items-center gap-3">
      <SegmentedControl v-model="cycle" :options="cycleOptions" label="Periodicidade" size="lg" class="w-[min(100%,340px)]" />
      <p class="text-center text-sm text-muted-foreground">{{ TRIAL_DAYS }} dias grátis, sem cartão. Depois, escolha o plano.</p>
    </div>

    <div class="grid w-full gap-5 lg:grid-cols-3 lg:items-stretch">
      <div v-for="({ plan, view }, index) in plans" :key="plan.code" :data-reveal="index + 1" class="flex">
        <section
          :aria-labelledby="`plano-${plan.code}`"
          class="plan-card flex w-full flex-col gap-6 rounded-[20px] border p-7 md:p-8"
          :class="plan.code === FEATURED ? 'dark-surface border-brand bg-brand text-brand-foreground shadow-[0_24px_60px_rgba(28,26,94,.22)]' : 'bg-card'"
        >
          <div class="flex flex-col gap-2">
            <div class="flex min-h-[26px] flex-wrap items-center justify-between gap-2">
              <h3 :id="`plano-${plan.code}`" class="text-[22px] font-semibold tracking-[-0.02em]" :class="plan.code === FEATURED && 'text-white'">{{ plan.name }}</h3>
              <span v-if="plan.code === FEATURED" class="inline-flex h-[26px] items-center rounded-full bg-[rgba(255,138,112,.16)] px-2.5 text-xs font-medium text-highlight">Para o consultório</span>
              <Badge v-else-if="plan.code === 'fundador'" variant="warning">{{ FOUNDERS_LIMIT }} vagas</Badge>
              <Badge v-else-if="!clinicContact" variant="neutral">Em breve</Badge>
            </div>
            <p class="text-[15px] leading-relaxed lg:min-h-[3.1em]" :class="plan.code === FEATURED ? 'text-[#C3CAF0]' : 'text-secondary-foreground'">{{ plan.audience }}</p>
          </div>

          <div aria-live="polite" class="min-h-[72px]">
            <div :key="`${plan.code}-${view.cycle}-${cycle}`" class="animate-fade flex flex-col gap-1">
              <p class="flex flex-wrap items-baseline gap-x-2">
                <span class="text-[40px] font-semibold leading-none tracking-[-0.03em]" :class="plan.code === FEATURED && 'text-white'">{{ view.price }}</span>
                <span class="text-[15px]" :class="plan.code === FEATURED ? 'text-brand-muted' : 'text-muted-foreground'">{{ view.unit }}</span>
              </p>
              <p class="font-mono text-xs tracking-[.04em]" :class="plan.code === FEATURED ? 'text-brand-muted' : 'text-muted-foreground'">{{ view.caption }}</p>
            </div>
          </div>

          <ul class="flex flex-col gap-3 text-[15px] leading-normal" :class="plan.code === FEATURED ? 'text-brand-foreground' : 'text-secondary-foreground'">
            <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2.5">
              <Check class="mt-0.5 size-[18px] shrink-0" :class="plan.code === FEATURED ? 'text-highlight' : 'text-primary'" :stroke-width="2.2" aria-hidden="true" />
              {{ feature }}
            </li>
          </ul>

          <p v-if="plan.note" class="text-[13px] leading-relaxed" :class="plan.code === FEATURED ? 'text-[#C3CAF0]' : 'text-muted-foreground'">{{ plan.note }}</p>

          <div class="mt-auto pt-2">
            <template v-if="plan.code === 'clinica'">
              <Button v-if="clinicContact" as-child size="xl" variant="outline" class="w-full">
                <a :href="clinicContact">Fale com a gente</a>
              </Button>
              <Button v-else size="xl" variant="outline" class="w-full" disabled>Em breve</Button>
            </template>
            <Button v-else as-child size="xl" :variant="plan.code === FEATURED ? 'on-brand' : 'default'" class="w-full">
              <NuxtLink to="/signup">Começar teste grátis</NuxtLink>
            </Button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-card {
  transition: transform .4s var(--ease-out), box-shadow .4s ease;
}
.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(22, 26, 58, .08);
}
.dark-surface :focus-visible {
  outline-color: hsl(var(--highlight));
}
</style>
