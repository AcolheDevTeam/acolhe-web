<script setup lang="ts">
import { CreditCard, TriangleAlert } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { BillingDetails, StripeRedirect } from '~/schemas/billing'
import type { ClinicTeam } from '~/schemas/clinic'
import type { User } from '~/types'
import type { BillingCycle, Plan } from '~/utils/plans'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InlineNotice } from '@/components/ui/inline-notice'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Assinatura do workspace (ACO-95; protótipos "Assinatura", "Planos" e
// "Bloqueio"). Quem assina vê plano, psicólogas (clínica), cartão, faturas e o
// cancelamento; no teste ou sem assinatura, a escolha de plano. O pagamento é
// no checkout do Stripe, e a troca de cartão no portal do Stripe. O Stripe
// volta para /assinatura?status=sucesso; o webhook pode chegar depois, então a
// página consulta a assinatura algumas vezes até ela ficar ativa.
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
const eyebrow = computed(() => isClinic.value ? (workspaces.value.find(w => w.current)?.name ?? 'Clínica') : 'Conta')

const { subscription, status, error, refresh } = useSubscription()
const sub = computed(() => subscription.value)
const paid = computed(() => hasPaidSubscription(sub.value))

const {
  data: details,
  error: detailsError,
  status: detailsStatus,
  refresh: refreshDetails,
} = useBillingDetails(() => canManage.value && paid.value)

// Equipe ativa da clínica: avatares e conta de vagas (só a administração lê).
const { data: team } = useFetch<ClinicTeam>('/api/clinic/team', {
  key: 'clinic-team',
  default: () => ({ members: [], invitations: [] }),
  immediate: isClinicAdmin(me.value),
})
const activeMembers = computed(() =>
  (team.value?.members ?? []).filter(m => m.status === 'active' && m.roles.includes('psychologist')),
)
const activeCount = computed(() => sub.value?.activePsychologists ?? activeMembers.value.length)
const clinicPlan = planByCode('clinica')
const billedCount = computed(() => sub.value?.seats ?? billedSeats(clinicPlan, activeCount.value))

const cycle = ref<BillingCycle>('monthly')
const cycleOptions: { value: BillingCycle, label: string }[] = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'annual', label: 'Anual' },
]
const plans = computed(() => plansForWorkspace(me.value?.workspace?.type))
function seatsFor(plan: Plan) {
  return billedSeats(plan, activeCount.value)
}

const currentPlan = computed(() => sub.value?.planCode ? planByCode(sub.value.planCode) : null)
const currentUnit = computed(() => {
  const plan = currentPlan.value
  if (!plan) return null
  const price = plan.prices[cycleFor(plan, sub.value?.billingCycle ?? 'monthly')]
  return price ? formatBRL(price.monthlyCents) : null
})
const cancelScheduled = computed(() => details.value?.cancelAtPeriodEnd === true)
const accessUntil = computed(() => {
  const value = details.value?.cancelAt ?? sub.value?.currentPeriodEnd
  return value ? longDate(value) : null
})

const summary = computed(() => {
  const s = sub.value
  if (!s) return null
  if (s.status === 'trialing') {
    const days = s.trialEndsAt ? trialDaysLeft(s.trialEndsAt) : null
    if (days === null) return { title: 'Teste grátis', lines: [`${TRIAL_DAYS} dias para conhecer o Acolhe.`] }
    if (days < 0 || !s.writable) return { title: 'Teste encerrado', lines: [`O teste terminou em ${longDate(s.trialEndsAt!)}. Escolha um plano para voltar a criar e editar.`] }
    const left = days === 0 ? 'Termina hoje' : `${days} ${days === 1 ? 'dia restante' : 'dias restantes'}`
    return { title: 'Teste grátis', lines: [left, `Até ${longDate(s.trialEndsAt!)}`] }
  }
  const plan = currentPlan.value
  const title = plan ? `${plan.name} · ${cycleLabel(s.billingCycle)}` : subscriptionStatusLabel(s.status)
  const lines: string[] = []
  if (currentUnit.value) lines.push(`${currentUnit.value} ${plan?.perSeat ? 'por psicóloga por mês' : 'por mês'}${s.billingCycle === 'annual' ? ', cobrado por ano' : ''}`)
  if (s.status === 'canceled' || cancelScheduled.value) lines.push('Sem cobranças futuras')
  else if (s.currentPeriodEnd) lines.push(`Próxima cobrança em ${longDate(s.currentPeriodEnd)}`)
  return { title, lines }
})

const invoices = computed(() => details.value?.invoices ?? [])
const card = computed(() => details.value?.card ?? null)

const busy = ref<string | null>(null)
const notice = ref('')

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

async function updateCard() {
  if (busy.value) return
  busy.value = 'portal'
  try {
    const { url } = await $fetch<StripeRedirect>('/api/billing/portal', { method: 'POST', body: { flow: 'payment_method_update' } })
    window.location.assign(url)
  }
  catch (err) {
    toast.error(billingErrorMessage(err, 'portal'))
    busy.value = null
  }
}

const confirmCancel = ref(false)
const cancelDescription = computed(() => {
  const until = accessUntil.value ? `até ${accessUntil.value}` : 'até o fim do período já pago'
  const who = isClinic.value ? 'a equipe e as pacientes' : 'você e suas pacientes'
  return `O plano continua ativo ${until}. Depois disso, ${who} continuam podendo ver os dados, mas não é possível criar sessões, registros ou atividades novas. Nenhum dado é apagado.`
})

async function setCancel(action: 'cancel' | 'reactivate') {
  if (busy.value) return
  busy.value = action
  notice.value = ''
  try {
    details.value = await $fetch<BillingDetails>(`/api/billing/${action}`, { method: 'POST' })
    if (action === 'reactivate') notice.value = 'Assinatura reativada. A próxima cobrança segue a data de sempre.'
    await refresh()
  }
  catch (err) {
    toast.error(billingErrorMessage(err, action))
  }
  finally {
    busy.value = null
  }
}

async function decideCancel(confirmed: boolean) {
  confirmCancel.value = false
  if (confirmed) await setCancel('cancel')
}

// Volta do checkout: confirma e espera o webhook ativar a assinatura.
const route = useRoute()
const router = useRouter()
const confirmed = ref(route.query.status === 'sucesso')
const waitingActivation = ref(false)
// Saindo da página no meio da espera, as consultas param.
let stopped = false
onBeforeUnmount(() => { stopped = true })
onMounted(async () => {
  if (!confirmed.value) return
  waitingActivation.value = true
  for (let attempt = 0; attempt < 6 && !stopped && sub.value?.status !== 'active'; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2500))
    if (stopped) break
    await refresh()
  }
  waitingActivation.value = false
  if (!stopped && route.path === BILLING_PATH) await router.replace({ query: {} })
})
</script>

<template>
  <PageHeader :eyebrow="eyebrow" title="Assinatura" />
  <div class="flex flex-col gap-6 px-4 pb-14 pt-7 md:px-8 lg:px-12">
    <div aria-live="polite" class="flex flex-col gap-3 empty:hidden">
      <InlineNotice v-if="confirmed">
        <template v-if="sub?.status === 'active'">Pagamento confirmado. A assinatura está ativa.</template>
        <template v-else-if="waitingActivation">Pagamento confirmado. Estamos ativando a assinatura…</template>
        <template v-else>Pagamento confirmado. A assinatura aparece aqui em alguns minutos; atualize a página se não aparecer.</template>
      </InlineNotice>
      <InlineNotice v-if="notice">{{ notice }}</InlineNotice>
    </div>

    <div v-if="error" class="flex flex-col items-start gap-3 text-sm" role="alert">
      <p class="text-destructive">{{ apiErrorMessage(error, { default: 'Não foi possível carregar a assinatura.' }) }}</p>
      <Button variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <p v-else-if="status === 'pending' && !sub" class="text-sm text-muted-foreground">Carregando assinatura…</p>
    <p v-else-if="!sub" class="text-sm text-muted-foreground">Este espaço de trabalho não tem assinatura.</p>

    <template v-else>
      <!-- Avisos do topo (protótipo): cobrança recusada e cancelamento agendado. -->
      <section
        v-if="sub.status === 'past_due'"
        role="alert"
        class="flex animate-fade flex-wrap items-center gap-4 rounded-[14px] bg-warning-soft px-5 py-[18px]"
      >
        <TriangleAlert class="size-[22px] shrink-0 text-warning" :stroke-width="1.8" aria-hidden="true" />
        <div class="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
          <p class="text-[15px] font-semibold text-warning">
            {{ card ? `Não conseguimos cobrar o cartão final ${card.last4}` : 'Não conseguimos cobrar a assinatura' }}
          </p>
          <p class="text-sm leading-normal text-secondary-foreground">
            <template v-if="sub.writable && sub.pastDueSince">Se o pagamento não for feito até {{ longCalendarDate(pastDueDeadline(sub.pastDueSince)) }}, a criação de registros novos fica pausada.</template>
            <template v-else>A criação de registros novos está pausada.</template>
            Ver os dados continua liberado.
          </p>
        </div>
        <Button v-if="canManage" :loading="busy === 'portal'" :disabled="!!busy" @click="updateCard">{{ busy === 'portal' ? 'Abrindo…' : 'Atualizar cartão' }}</Button>
      </section>
      <section
        v-else-if="cancelScheduled"
        class="flex animate-fade flex-wrap items-center gap-4 rounded-[14px] border bg-card px-5 py-4"
      >
        <p class="min-w-0 flex-[1_1_320px] text-sm leading-normal text-secondary-foreground">
          <strong class="font-semibold text-foreground">Assinatura cancelada.</strong>
          O acesso completo continua {{ accessUntil ? `até ${accessUntil}` : 'até o fim do período pago' }}. Depois disso, {{ isClinic ? 'a equipe e as pacientes ainda podem' : 'você e suas pacientes ainda podem' }} ver os dados.
        </p>
        <Button variant="outline" :loading="busy === 'reactivate'" :disabled="!!busy" @click="setCancel('reactivate')">Reativar assinatura</Button>
      </section>
      <InlineNotice v-else-if="sub.status === 'canceled'" tone="neutral">
        <strong class="font-semibold text-foreground">Assinatura cancelada.</strong>
        Você e suas pacientes continuam podendo ver os dados. Para voltar a criar e editar, assine de novo.
      </InlineNotice>

      <InlineNotice v-if="canManage && paid && detailsError" tone="warning" class="flex flex-wrap items-center justify-between gap-3">
        <span>{{ billingErrorMessage(detailsError, 'details') }} O plano e a situação abaixo estão atualizados.</span>
        <Button variant="outline" size="sm" @click="refreshDetails()">Tentar novamente</Button>
      </InlineNotice>

      <div :class="['grid gap-5 md:grid-cols-2', isClinic && canManage && paid && 'xl:grid-cols-3']">
        <section aria-labelledby="t-plano" class="flex animate-rise flex-col gap-3.5 rounded-2xl bg-brand p-6 text-brand-foreground">
          <h2 id="t-plano" class="label-mono text-[11px] !text-brand-muted">{{ sub.status === 'trialing' ? 'Período de teste' : 'Plano atual' }}</h2>
          <p class="text-[26px] font-semibold tracking-[-0.02em] text-white">{{ summary?.title }}</p>
          <p v-for="line in summary?.lines" :key="line" class="text-sm text-brand-foreground/80">{{ line }}</p>
        </section>

        <Card v-if="isClinic && canManage" role="region" aria-labelledby="t-vagas" class="flex animate-rise flex-col gap-3.5 p-6 [animation-delay:.06s]">
          <h2 id="t-vagas" class="label-mono text-[11px]">Psicólogas</h2>
          <p class="text-[26px] font-semibold tracking-[-0.02em]">
            {{ activeCount }} <span class="text-[15px] font-normal text-muted-foreground">{{ activeCount === 1 ? 'ativa' : 'ativas' }} · cobradas {{ billedCount }} (mínimo {{ clinicPlan.minSeats }})</span>
          </p>
          <div v-if="activeMembers.length" class="flex" aria-hidden="true">
            <Avatar
              v-for="(member, i) in activeMembers.slice(0, 6)"
              :key="member.userId"
              :class="['h-[34px] w-[34px] border-2 border-card text-xs', i > 0 && '-ml-2']"
            >
              <AvatarFallback>{{ initials(member.fullName ?? member.email) }}</AvatarFallback>
            </Avatar>
            <span v-if="activeMembers.length > 6" class="-ml-2 flex h-[34px] items-center rounded-full border-2 border-card bg-secondary px-2 font-mono text-xs text-muted-foreground">+{{ activeMembers.length - 6 }}</span>
          </div>
          <p class="text-sm leading-relaxed text-muted-foreground">
            As vagas acompanham a equipe: quando alguém entra ou sai, a cobrança se ajusta sozinha. Quem só administra não paga.
          </p>
        </Card>

        <Card v-if="canManage && paid" role="region" aria-labelledby="t-pagamento" class="flex animate-rise flex-col gap-3.5 p-6 [animation-delay:.12s]">
          <h2 id="t-pagamento" class="label-mono text-[11px]">Forma de pagamento</h2>
          <p v-if="detailsStatus === 'pending' && !details" class="text-sm text-muted-foreground">Carregando cartão…</p>
          <div v-else-if="card" class="flex items-center gap-3">
            <span class="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground" aria-hidden="true">
              <CreditCard class="size-5" :stroke-width="1.7" />
            </span>
            <span class="flex flex-col gap-0.5">
              <span class="font-mono text-[15px] font-medium">•••• {{ card.last4 }}</span>
              <span class="text-[13px] text-muted-foreground">{{ cardBrandLabel(card.brand) }} · vence {{ cardExpiry(card.expMonth, card.expYear) }}</span>
            </span>
          </div>
          <p v-else-if="detailsError" class="text-sm text-muted-foreground">Cartão indisponível no momento.</p>
          <p v-else class="text-sm text-muted-foreground">Nenhum cartão cadastrado.</p>
          <div class="mt-auto pt-1">
            <Button variant="outline" :loading="busy === 'portal'" :disabled="!!busy" @click="updateCard">
              {{ busy === 'portal' ? 'Abrindo…' : card || detailsError ? 'Trocar cartão' : 'Cadastrar cartão' }}
            </Button>
          </div>
        </Card>
      </div>

      <InlineNotice v-if="!canManage" tone="neutral">
        A cobrança da clínica é feita pela responsável ou pela administração. Fale com elas para assinar ou mudar o plano.
      </InlineNotice>

      <template v-else-if="paid">
        <Card role="region" aria-labelledby="t-faturas" class="animate-rise overflow-hidden [animation-delay:.18s]">
          <h2 id="t-faturas" class="px-[22px] pb-2 pt-5 text-lg font-semibold">Faturas</h2>
          <p v-if="detailsStatus === 'pending' && !details" class="px-[22px] pb-5 text-sm text-muted-foreground">Carregando faturas…</p>
          <p v-else-if="detailsError" class="px-[22px] pb-5 text-sm text-muted-foreground">As faturas não puderam ser carregadas agora.</p>
          <div v-else-if="!invoices.length" class="mx-[22px] mb-5 rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
            Nenhuma fatura ainda.
          </div>
          <template v-else>
            <!-- Celular: lista (padrão da Equipe). -->
            <ul class="flex flex-col divide-y divide-secondary md:hidden">
              <li v-for="invoice in invoices" :key="invoice.id" class="flex flex-wrap items-center gap-x-3 gap-y-2 px-[22px] py-3.5">
                <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span class="text-[15px] font-semibold">{{ invoicePeriodLabel(invoice.periodStart) }}</span>
                  <span class="font-mono text-[13px] text-muted-foreground">{{ formatBRL(invoice.amountCents) }}</span>
                </span>
                <Badge :variant="invoiceStatusMeta(invoice.status).variant" class="h-6">{{ invoiceStatusMeta(invoice.status).label }}</Badge>
                <a
                  v-if="invoice.pdfUrl || invoice.hostedUrl"
                  :href="invoice.pdfUrl || invoice.hostedUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full text-sm font-medium text-primary underline-offset-[3px] hover:underline"
                  :aria-label="`${invoice.pdfUrl ? 'Baixar PDF' : 'Ver fatura'} de ${invoicePeriodLabel(invoice.periodStart)}`"
                >{{ invoice.pdfUrl ? 'Baixar PDF' : 'Ver fatura' }}</a>
              </li>
            </ul>
            <Table class="hidden md:table">
              <TableHeader>
                <TableRow class="border-border hover:bg-transparent">
                  <TableHead class="pl-[22px]">Período</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead class="pr-[22px]"><span class="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(invoice, i) in invoices" :key="invoice.id" class="animate-fade" :style="{ animationDelay: `${i * 0.05}s` }">
                  <TableCell class="pl-[22px] font-medium">{{ invoicePeriodLabel(invoice.periodStart) }}</TableCell>
                  <TableCell class="font-mono">{{ formatBRL(invoice.amountCents) }}</TableCell>
                  <TableCell><Badge :variant="invoiceStatusMeta(invoice.status).variant" class="h-6">{{ invoiceStatusMeta(invoice.status).label }}</Badge></TableCell>
                  <TableCell class="pr-[22px] text-right">
                    <a
                      v-if="invoice.pdfUrl || invoice.hostedUrl"
                      :href="invoice.pdfUrl || invoice.hostedUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm font-medium text-primary underline-offset-[3px] hover:underline"
                      :aria-label="`${invoice.pdfUrl ? 'Baixar PDF' : 'Ver fatura'} de ${invoicePeriodLabel(invoice.periodStart)}`"
                    >{{ invoice.pdfUrl ? 'Baixar PDF' : 'Ver fatura' }}</a>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </template>
        </Card>

        <section
          aria-labelledby="t-cancelar"
          class="flex animate-rise flex-wrap items-center justify-between gap-4 border-t pt-6 [animation-delay:.24s]"
        >
          <div class="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
            <h2 id="t-cancelar" class="text-base font-semibold">Cancelar assinatura</h2>
            <p class="text-sm text-muted-foreground">O acesso continua até o fim do período já pago.</p>
          </div>
          <Button
            variant="destructive-soft"
            :loading="busy === 'cancel'"
            :disabled="!!busy || cancelScheduled || !details"
            @click="confirmCancel = true"
          >
            {{ cancelScheduled ? 'Cancelamento agendado' : 'Cancelar assinatura' }}
          </Button>
        </section>
        <ConfirmDialog
          :open="confirmCancel"
          :title="isClinic ? 'Cancelar a assinatura da clínica?' : 'Cancelar a assinatura?'"
          :description="cancelDescription"
          confirm-label="Cancelar no fim do período"
          cancel-label="Manter assinatura"
          destructive
          @decision="decideCancel"
        />
      </template>

      <section v-else aria-labelledby="t-planos" class="flex animate-rise flex-col gap-5 [animation-delay:.12s]">
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
          Se a assinatura vencer, você e suas pacientes continuam podendo ver todos os dados. Só não é possível criar registros novos.
        </p>
      </section>
    </template>
  </div>
</template>
