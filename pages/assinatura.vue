<script setup lang="ts">
import { TriangleAlert } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { StripeRedirect } from '~/schemas/billing'
import type { ClinicTeam } from '~/schemas/clinic'
import type { User } from '~/types'
import type { BillingCycle, Plan } from '~/utils/plans'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InlineNotice } from '@/components/ui/inline-notice'
import { SegmentedControl } from '@/components/ui/segmented-control'

// Assinatura do workspace (ACO-95; protótipos "Assinatura", "Planos" e
// "Bloqueio"). O pagamento é no checkout do Stripe e a gestão (cartão, faturas,
// cancelamento, troca de plano) no portal do Stripe: aqui só o estado, a
// escolha do plano e os dois redirecionamentos. O Stripe volta para
// /assinatura?status=sucesso; o webhook pode chegar depois, então a página
// consulta a assinatura algumas vezes até ela ficar ativa.
definePageMeta({
  middleware: ['auth', () => {
    const { data: user } = useNuxtData<User | null>('me')
    if (!hasBilling(user.value)) {
      return navigateTo(user.value?.role === 'patient' ? patientRedirect('patient') : homeFor(user.value))
    }
  }],
})

const { data: me } = useNuxtData<User | null>('me')
const isClinic = computed(() => me.value?.workspace?.type === 'clinic')
const canManage = computed(() => canManageBilling(me.value))
const { workspaces } = useWorkspaces()
const workspaceName = computed(() => workspaces.value.find(w => w.current)?.name ?? (isClinic.value ? 'Clínica' : 'Consultório'))

const { subscription, status, error, refresh } = useSubscription()
const sub = computed(() => subscription.value)
const paid = computed(() => hasPaidSubscription(sub.value))

// Psicólogas ativas da clínica, para a conta de vagas antes da assinatura.
const { data: team } = useFetch<ClinicTeam>('/api/clinic/team', {
  key: 'clinic-team',
  default: () => ({ members: [], invitations: [] }),
  immediate: isClinicAdmin(me.value),
})
const activePsychologists = computed(() =>
  (team.value?.members ?? []).filter(m => m.status === 'active' && m.roles.includes('psychologist')).length,
)

const cycle = ref<BillingCycle>('monthly')
const cycleOptions: { value: BillingCycle, label: string }[] = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'annual', label: 'Anual' },
]
const plans = computed(() => plansForWorkspace(me.value?.workspace?.type))
function seatsFor(plan: Plan) {
  return billedSeats(plan, sub.value?.seats ?? activePsychologists.value)
}

const currentPlan = computed(() => sub.value?.planCode ? planByCode(sub.value.planCode) : null)
const currentUnit = computed(() => {
  const plan = currentPlan.value
  if (!plan) return null
  const price = plan.prices[cycleFor(plan, sub.value?.billingCycle ?? 'monthly')]
  return price ? formatBRL(price.monthlyCents) : null
})
const trialDays = computed(() => sub.value?.trialEndsAt ? trialDaysLeft(sub.value.trialEndsAt) : null)

const summary = computed(() => {
  const s = sub.value
  if (!s) return null
  if (s.status === 'trialing') {
    const days = trialDays.value
    if (days === null) return { title: 'Teste grátis', lines: [`${TRIAL_DAYS} dias para conhecer o Acolhe.`] }
    if (days < 0 || !s.writable) return { title: 'Teste encerrado', lines: [`O teste terminou em ${formatDate(s.trialEndsAt)}. Escolha um plano para voltar a criar e editar.`] }
    const left = days === 0 ? 'Termina hoje' : `${days} ${days === 1 ? 'dia restante' : 'dias restantes'}`
    return { title: 'Teste grátis', lines: [left, `Até ${formatDate(s.trialEndsAt)}`] }
  }
  const plan = currentPlan.value
  const title = plan ? `${plan.name} · ${cycleLabel(s.billingCycle)}` : subscriptionStatusLabel(s.status)
  const lines: string[] = []
  if (currentUnit.value) lines.push(`${currentUnit.value} ${plan?.perSeat ? 'por psicóloga por mês' : 'por mês'}${s.billingCycle === 'annual' ? ', cobrado por ano' : ''}`)
  if (s.status === 'canceled') lines.push(s.writable && s.currentPeriodEnd ? `Acesso completo até ${formatDate(s.currentPeriodEnd)}` : 'Sem cobranças futuras')
  else if (s.currentPeriodEnd) lines.push(`Próxima cobrança em ${formatDate(s.currentPeriodEnd)}`)
  return { title, lines }
})

const busy = ref<string | null>(null)

async function subscribe(plan: Plan) {
  if (busy.value) return
  busy.value = plan.code
  try {
    const { url } = await $fetch<StripeRedirect>('/api/billing/checkout', {
      method: 'POST',
      body: { plan: plan.code, cycle: cycleFor(plan, cycle.value) },
    })
    // Fica "Abrindo…" até o navegador sair para o Stripe.
    window.location.assign(url)
  }
  catch (err) {
    toast.error(billingErrorMessage(err, 'checkout'))
    busy.value = null
  }
}

async function openPortal() {
  if (busy.value) return
  busy.value = 'portal'
  try {
    const { url } = await $fetch<StripeRedirect>('/api/billing/portal', { method: 'POST' })
    window.location.assign(url)
  }
  catch (err) {
    toast.error(billingErrorMessage(err, 'portal'))
    busy.value = null
  }
}

// Volta do checkout: confirma e espera o webhook ativar a assinatura.
const route = useRoute()
const router = useRouter()
const confirmed = ref(route.query.status === 'sucesso')
const waitingActivation = ref(false)
onMounted(async () => {
  if (!confirmed.value) return
  waitingActivation.value = true
  for (let attempt = 0; attempt < 6 && sub.value?.status !== 'active'; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2500))
    await refresh()
  }
  waitingActivation.value = false
  await router.replace({ query: {} })
})
</script>

<template>
  <PageHeader :eyebrow="workspaceName" title="Assinatura" />
  <div class="flex flex-col gap-6 px-4 pb-14 pt-7 md:px-8 lg:px-12">
    <div aria-live="polite" class="flex flex-col gap-3 empty:hidden">
      <InlineNotice v-if="confirmed">
        <template v-if="sub?.status === 'active'">Pagamento confirmado. A assinatura está ativa.</template>
        <template v-else-if="waitingActivation">Pagamento confirmado. Estamos ativando a assinatura…</template>
        <template v-else>Pagamento confirmado. A assinatura aparece aqui em alguns minutos; atualize a página se não aparecer.</template>
      </InlineNotice>
    </div>

    <div v-if="error" class="flex flex-col items-start gap-3 text-sm" role="alert">
      <p class="text-destructive">{{ apiErrorMessage(error, { default: 'Não foi possível carregar a assinatura.' }) }}</p>
      <Button variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <p v-else-if="status === 'pending' && !sub" class="text-sm text-muted-foreground">Carregando assinatura…</p>
    <p v-else-if="!sub" class="text-sm text-muted-foreground">Este espaço de trabalho não tem assinatura.</p>

    <template v-else>
      <section
        v-if="sub.status === 'past_due'"
        role="alert"
        class="flex animate-fade flex-wrap items-center gap-4 rounded-[14px] bg-warning-soft px-5 py-[18px]"
      >
        <TriangleAlert class="size-[22px] shrink-0 text-warning" :stroke-width="1.8" aria-hidden="true" />
        <div class="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
          <p class="text-[15px] font-semibold text-warning">Não conseguimos cobrar a assinatura</p>
          <p class="text-sm leading-normal text-secondary-foreground">
            <template v-if="sub.writable && sub.pastDueSince">Se o pagamento não for feito até {{ formatDate(pastDueDeadline(sub.pastDueSince)) }}, a criação de registros novos fica pausada.</template>
            <template v-else>{{ READ_ONLY_MESSAGE }}</template>
            Ver e exportar dados continua liberado.
          </p>
        </div>
        <Button v-if="canManage" :loading="busy === 'portal'" :disabled="!!busy" @click="openPortal">{{ busy === 'portal' ? 'Abrindo…' : 'Atualizar pagamento' }}</Button>
      </section>
      <InlineNotice v-else-if="sub.status === 'canceled'" tone="neutral">
        <strong class="font-semibold text-foreground">Assinatura cancelada.</strong>
        Você e suas pacientes continuam podendo ver e exportar os dados. Para voltar a criar e editar, assine de novo.
      </InlineNotice>

      <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <section aria-labelledby="t-plano" class="flex animate-rise flex-col gap-3.5 rounded-2xl bg-brand p-6 text-brand-foreground">
          <h2 id="t-plano" class="label-mono text-[11px] !text-brand-muted">{{ sub.status === 'trialing' ? 'Período de teste' : 'Plano atual' }}</h2>
          <p class="text-[26px] font-semibold tracking-[-0.02em] text-white">{{ summary?.title }}</p>
          <p v-for="line in summary?.lines" :key="line" class="text-sm text-brand-foreground/80">{{ line }}</p>
        </section>

        <Card v-if="isClinic" role="region" aria-labelledby="t-vagas" class="flex animate-rise flex-col gap-3.5 p-6 [animation-delay:.06s]">
          <h2 id="t-vagas" class="label-mono text-[11px]">Psicólogas</h2>
          <p class="text-[26px] font-semibold tracking-[-0.02em]">
            {{ sub.seats ?? seatsFor(planByCode('clinica')) }}
            <span class="text-[15px] font-normal text-muted-foreground">{{ sub.seats ? 'na assinatura' : 'a cobrar' }}</span>
          </p>
          <p class="text-sm leading-relaxed text-muted-foreground">{{ planByCode('clinica').note }} As vagas acompanham a equipe ativa.</p>
        </Card>

        <Card v-if="canManage && sub.status !== 'trialing'" role="region" aria-labelledby="t-pagamento" class="flex animate-rise flex-col gap-3.5 p-6 [animation-delay:.12s]">
          <h2 id="t-pagamento" class="label-mono text-[11px]">Pagamento e faturas</h2>
          <p class="text-sm leading-relaxed text-secondary-foreground">Cartão, faturas, troca de plano e cancelamento ficam no portal de cobrança do Stripe.</p>
          <div class="mt-auto pt-1">
            <Button variant="outline" :loading="busy === 'portal'" :disabled="!!busy" @click="openPortal">{{ busy === 'portal' ? 'Abrindo…' : 'Gerenciar assinatura' }}</Button>
          </div>
        </Card>
      </div>

      <InlineNotice v-if="!canManage" tone="neutral">
        A cobrança da clínica é feita pela responsável ou pela administração. Fale com elas para assinar ou mudar o plano.
      </InlineNotice>

      <section v-else-if="!paid" aria-labelledby="t-planos" class="flex animate-rise flex-col gap-5 [animation-delay:.12s]">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="flex flex-col gap-1">
            <h2 id="t-planos" class="text-xl font-semibold tracking-[-0.02em]">Escolha um plano</h2>
            <p class="text-sm text-muted-foreground">O pagamento é feito no Stripe, com cartão.</p>
          </div>
          <SegmentedControl v-model="cycle" :options="cycleOptions" label="Periodicidade" class="w-full sm:w-56" />
        </div>
        <div class="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          <PlanCard
            v-for="plan in plans"
            :key="plan.code"
            :plan="plan"
            :cycle="cycle"
            :seats="seatsFor(plan)"
            :dark="plan.code === 'clinica'"
          >
            <Button
              :variant="plan.code === 'clinica' ? 'on-brand' : 'default'"
              size="lg"
              class="w-full"
              :loading="busy === plan.code"
              :disabled="!!busy"
              @click="subscribe(plan)"
            >
              {{ busy === plan.code ? 'Abrindo pagamento…' : `Assinar ${plan.name}` }}
            </Button>
          </PlanCard>
        </div>
        <p class="text-[13px] leading-relaxed text-muted-foreground">
          Se a assinatura vencer, você e suas pacientes continuam podendo ver e exportar todos os dados. Só não é possível criar registros novos.
        </p>
      </section>
    </template>
  </div>
</template>
