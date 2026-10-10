<script setup lang="ts">
import { Building2, ChevronLeft, ChevronRight, Eye, Mail, Plus, Search, X } from 'lucide-vue-next'
import { z } from 'zod'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { RadioCardGroup } from '@/components/ui/radio-card-group'
import type { AdminAccount, AdminAccounts, AdminInvitation, AdminOverview } from '~/schemas/clinic'
import { cancelClinicSchema, createClinicFormSchema } from '~/schemas/clinic'
import { APP_TIMEZONE } from '~/utils/timezone'
import { normalizeCnpj } from '~/utils/cnpj'

definePageMeta({ layout: 'admin', middleware: ['auth', 'platform-admin'] })

const PAGE_SIZE = 20
type DialogMode = 'closed' | 'create' | 'platform-invite' | 'invitation' | 'resend' | 'cancel' | 'result'

const search = ref('')
const searchQuery = ref('')
const type = ref('all')
const status = ref('all')
const offset = ref(0)
const dialogMode = ref<DialogMode>('closed')
const selectedAccount = ref<AdminAccount | null>(null)
const invitation = ref<AdminInvitation | null>(null)
const invitationLoading = ref(false)
const formError = ref('')
const formBusy = ref(false)
const resultLink = ref('')
const resultDelivery = ref<'sent' | 'failed' | 'disabled' | null>(null)
const resultType = ref<'clinic' | 'platform'>('clinic')
const copied = ref(false)
const cancelReason = ref('')
const platformInviteEmail = ref('')
const form = reactive({ name: '', cnpj: '', ownerEmail: '', ownerAttends: false })
const ownerAttendsChoice = computed({
  get: () => form.ownerAttends ? 'yes' : 'no',
  set: (value: string) => { form.ownerAttends = value === 'yes' },
})
const ownerAttendsOptions = [
  { value: 'no', label: 'Não', description: 'Só administra a clínica' },
  { value: 'yes', label: 'Sim', description: 'Também atende como psicóloga' },
]
const errors = reactive<Record<string, string>>({})

const typeOptions = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'individual', label: 'Consultório' },
  { value: 'clinic', label: 'Clínica' },
]
const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'trialing', label: 'Em avaliação' },
  { value: 'active', label: 'Ativa' },
  { value: 'past_due', label: 'Pagamento pendente' },
  { value: 'canceled', label: 'Cancelada' },
]

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchQuery.value = value.trim()
    offset.value = 0
  }, 250)
})
watch([type, status], () => { offset.value = 0 })
onBeforeUnmount(() => clearTimeout(searchTimer))

const { data: overview, error: overviewError, status: overviewStatus, refresh: refreshOverview } = useFetch<AdminOverview>('/api/admin/overview', {
  key: 'admin-overview',
})
const accountQuery = computed(() => ({
  query: searchQuery.value || undefined,
  type: type.value === 'all' ? undefined : type.value,
  status: status.value === 'all' ? undefined : status.value,
  limit: PAGE_SIZE,
  offset: offset.value,
}))
const accountKey = computed(() => `admin-accounts-${searchQuery.value}-${type.value}-${status.value}-${offset.value}`)
const { data: accountsResponse, error: accountsError, status: accountsStatus, refresh: refreshAccounts } = useFetch<AdminAccounts>('/api/admin/accounts', {
  key: accountKey,
  query: accountQuery,
  default: () => ({ items: [], total: 0 }),
})
const accounts = computed(() => accountsResponse.value?.items ?? [])
const total = computed(() => accountsResponse.value?.total ?? 0)
const page = computed(() => Math.floor(offset.value / PAGE_SIZE) + 1)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

function cnpjMask(value: string) {
  const characters = normalizeCnpj(value).replace(/[^0-9A-Z]/g, '').slice(0, 14)
  return characters
    .replace(/^([0-9A-Z]{2})([0-9A-Z])/, '$1.$2')
    .replace(/^([0-9A-Z]{2})\.([0-9A-Z]{3})([0-9A-Z])/, '$1.$2.$3')
    .replace(/\.([0-9A-Z]{3})([0-9A-Z])/, '.$1/$2')
    .replace(/([0-9A-Z]{4})([0-9A-Z])/, '$1-$2')
}

function openCreate() {
  resetForm()
  dialogMode.value = 'create'
}

function resetForm() {
  form.name = ''
  form.cnpj = ''
  form.ownerEmail = ''
  form.ownerAttends = false
  formError.value = ''
  Object.keys(errors).forEach(key => delete errors[key])
}

function setErrors(error: z.ZodError) {
  Object.keys(errors).forEach(key => delete errors[key])
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!errors[key]) errors[key] = issue.message
  }
}

function invitationStatusLabel(value: string | null | undefined) {
  if (value === 'pending') return 'Convite pendente'
  if (value === 'accepted') return 'Convite aceito'
  if (value === 'expired') return 'Convite expirado'
  if (value === 'canceled' || value === 'cancelled') return 'Criação cancelada'
  return 'Sem convite pendente'
}

function subscriptionLabel(value: AdminAccount['subscriptionStatus'], invitationStatus?: string | null) {
  if (!value) return invitationStatus === 'pending' || invitationStatus === 'expired' ? 'Convite pendente' : 'Sem assinatura'
  return ({ trialing: 'Em avaliação', active: 'Ativa', past_due: 'Pagamento pendente', canceled: 'Cancelada' })[value]
}

function subscriptionClasses(value: AdminAccount['subscriptionStatus']) {
  if (!value) return 'bg-[#FFF3D8] text-[#805B00]'
  if (value === 'past_due') return 'bg-[#FDEBE7] text-[#9E3522]'
  if (value === 'canceled') return 'bg-[#EFF2FB] text-[#5C6385]'
  return 'bg-[#E6EAFD] text-[#2B2E9E]'
}

function deliveryLabel(value: AdminInvitation['deliveryStatus'] | null) {
  if (value === 'sent') return 'E-mail enviado'
  if (value === 'failed') return 'Falha no envio do e-mail'
  if (value === 'disabled') return 'Envio de e-mail desativado'
  return 'Não informado'
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: APP_TIMEZONE }).format(date)
}

function planLabel(value: string | null) {
  if (!value) return '—'
  return value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}

function canManageInvitation(account: AdminAccount) {
  return account.type === 'clinic' && ['pending', 'expired'].includes(account.initialInvitationStatus ?? '')
}

function openPlatformInvite() {
  platformInviteEmail.value = ''
  formError.value = ''
  dialogMode.value = 'platform-invite'
}

async function sendPlatformInvite() {
  const email = platformInviteEmail.value.trim().toLowerCase()
  if (!z.string().email().safeParse(email).success) {
    formError.value = 'Informe um e-mail válido.'
    return
  }
  formBusy.value = true
  formError.value = ''
  try {
    const result = await $fetch<{ email: string, link: string, expiresAt: string, deliveryStatus: 'sent' | 'failed' | 'disabled' }>('/api/admin/invitations', { method: 'POST', body: { email } })
    resultLink.value = result.link
    resultDelivery.value = result.deliveryStatus
    resultType.value = 'platform'
    dialogMode.value = 'result'
  }
  catch (error) {
    formError.value = apiErrorMessage(error, { 409: 'Este e-mail já possui uma conta ou convite ativo.', default: 'Não foi possível enviar o convite agora. Tente novamente.' })
  }
  finally {
    formBusy.value = false
  }
}

async function showInvitation(account: AdminAccount) {
  selectedAccount.value = account
  invitation.value = null
  formError.value = ''
  invitationLoading.value = true
  dialogMode.value = 'invitation'
  try {
    invitation.value = await $fetch<AdminInvitation>(`/api/admin/clinics/${account.id}/invitation`)
  }
  catch (error) {
    formError.value = apiErrorMessage(error, { 404: 'Não encontramos um convite inicial pendente para esta clínica.', default: 'Não foi possível consultar o convite agora.' })
  }
  finally {
    invitationLoading.value = false
  }
}

function askResend(account: AdminAccount) {
  selectedAccount.value = account
  formError.value = ''
  dialogMode.value = 'resend'
}

function askCancel(account: AdminAccount) {
  selectedAccount.value = account
  cancelReason.value = ''
  formError.value = ''
  dialogMode.value = 'cancel'
}

async function createClinic() {
  formError.value = ''
  const parsed = createClinicFormSchema.safeParse({ ...form })
  if (!parsed.success) {
    setErrors(parsed.error)
    return
  }
  Object.keys(errors).forEach(key => delete errors[key])
  formBusy.value = true
  try {
    const result = await $fetch<{ organizationId: string, invitation: AdminInvitation & { link: string } }>('/api/admin/clinics', {
      method: 'POST',
      body: parsed.data,
    })
    resultLink.value = result.invitation.link ?? ''
    resultDelivery.value = result.invitation.deliveryStatus
    resultType.value = 'clinic'
    dialogMode.value = 'result'
    await Promise.all([refreshAccounts(), refreshOverview()])
  }
  catch (error) {
    formError.value = apiErrorMessage(error, {
      400: 'Confira os dados: o nome, o CNPJ ou o e-mail da responsável não foram aceitos.',
      409: 'Este CNPJ já está em uso ou já existe uma conta com este e-mail. Confira os dados.',
      default: 'Não foi possível criar a clínica agora. Tente novamente.',
    })
  }
  finally {
    formBusy.value = false
  }
}

async function resendInvitation() {
  if (!selectedAccount.value) return
  formBusy.value = true
  formError.value = ''
  try {
    const result = await $fetch<{ organizationId: string, invitation: AdminInvitation & { link: string } }>(`/api/admin/clinics/${selectedAccount.value.id}/invitation/resend`, { method: 'POST' })
    resultLink.value = result.invitation.link ?? ''
    resultDelivery.value = result.invitation.deliveryStatus
    dialogMode.value = 'result'
    await Promise.all([refreshAccounts(), refreshOverview()])
  }
  catch (error) {
    formError.value = apiErrorMessage(error, {
      404: 'O convite inicial não está mais pendente e não pode ser reenviado.',
      409: 'O convite não pode ser reenviado neste estado. Atualize a lista e confira o status.',
      default: 'Não foi possível reenviar o convite agora. Tente novamente.',
    })
  }
  finally {
    formBusy.value = false
  }
}

async function cancelClinic() {
  if (!selectedAccount.value) return
  const parsed = cancelClinicSchema.safeParse({ reason: cancelReason.value })
  if (!parsed.success) {
    formError.value = parsed.error.issues[0]?.message ?? 'Descreva o motivo do cancelamento.'
    return
  }
  formBusy.value = true
  formError.value = ''
  try {
    await $fetch(`/api/admin/clinics/${selectedAccount.value.id}/cancel`, { method: 'POST', body: parsed.data })
    dialogMode.value = 'closed'
    await Promise.all([refreshAccounts(), refreshOverview()])
  }
  catch (error) {
    formError.value = apiErrorMessage(error, {
      404: 'O convite inicial não está mais pendente e não pode ser cancelado.',
      409: 'A clínica já foi ativada ou o convite não pode ser cancelado neste estado.',
      default: 'Não foi possível cancelar a criação da clínica agora. Tente novamente.',
    })
  }
  finally {
    formBusy.value = false
  }
}

async function copyLink() {
  if (!resultLink.value) return
  try {
    await navigator.clipboard.writeText(resultLink.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    formError.value = 'Não foi possível copiar o link. Selecione e copie o endereço exibido.'
  }
}

function closeDialog() {
  if (formBusy.value) return
  dialogMode.value = 'closed'
  formError.value = ''
  invitation.value = null
  resultLink.value = ''
  copied.value = false
}

const rangeStart = computed(() => total.value ? offset.value + 1 : 0)
const rangeEnd = computed(() => Math.min(offset.value + PAGE_SIZE, total.value))
</script>

<template>
  <main class="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-4 pb-14 pt-7 sm:px-6 lg:px-10 lg:pt-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-2">
        <p class="label-mono">Equipe Acolhe</p>
        <h1 class="text-[28px] font-semibold tracking-[-0.03em] sm:text-[32px]">Contas e assinaturas</h1>
        <p class="max-w-3xl text-sm leading-6 text-secondary-foreground">Dados administrativos e de cobrança. Este painel não mostra pacientes, prontuários nem atividades.</p>
      </div>
      <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button variant="outline" class="w-full sm:w-auto" @click="openPlatformInvite"><Mail class="size-4" aria-hidden="true" />Convidar admin</Button>
        <Button class="w-full sm:w-auto" @click="openCreate"><Plus class="size-4" aria-hidden="true" />Criar clínica</Button>
      </div>
    </div>

    <div v-if="overviewError" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
      <p class="text-destructive">{{ apiErrorMessage(overviewError, { default: 'Não foi possível carregar o resumo de contas.' }) }}</p>
      <Button variant="outline" size="sm" @click="refreshOverview">Tentar novamente</Button>
    </div>
    <section v-else aria-label="Resumo das contas" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card class="flex min-h-32 flex-col gap-2 p-5">
        <span class="label-mono">Contas ativas</span>
        <strong class="text-3xl font-semibold tracking-[-0.03em]">{{ overviewStatus === 'pending' ? '—' : overview?.activeAccounts ?? 0 }}</strong>
        <span class="text-[13px] text-muted-foreground">Assinatura ativa</span>
      </Card>
      <Card class="flex min-h-32 flex-col gap-2 p-5">
        <span class="label-mono">Em avaliação</span>
        <strong class="text-3xl font-semibold tracking-[-0.03em]">{{ overviewStatus === 'pending' ? '—' : overview?.trialingAccounts ?? 0 }}</strong>
        <span class="text-[13px] text-muted-foreground">Período de teste</span>
      </Card>
      <Card class="flex min-h-32 flex-col gap-2 border-[#F3C9C1] p-5">
        <span class="label-mono text-[#9E3522]">Pagamento pendente</span>
        <strong class="text-3xl font-semibold tracking-[-0.03em] text-[#9E3522]">{{ overviewStatus === 'pending' ? '—' : overview?.pastDueAccounts ?? 0 }}</strong>
        <span class="text-[13px] text-muted-foreground">Contas com cobrança em atraso</span>
      </Card>
      <Card class="flex min-h-32 flex-col gap-2 p-5">
        <span class="label-mono">Convite inicial pendente</span>
        <strong class="text-3xl font-semibold tracking-[-0.03em]">{{ overviewStatus === 'pending' ? '—' : overview?.pendingClinicInvitations ?? 0 }}</strong>
        <span class="text-[13px] text-muted-foreground">Clínicas aguardando a responsável</span>
      </Card>
    </section>

    <Card class="overflow-hidden">
      <div class="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold tracking-[-0.01em]">Contas</h2>
            <p class="mt-1 text-sm text-muted-foreground">{{ total }} {{ total === 1 ? 'conta' : 'contas' }} no resultado</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <CustomDropdown v-model="type" :options="typeOptions" aria-label="Filtrar por tipo de conta" class="w-full sm:w-44" />
            <CustomDropdown v-model="status" :options="statusOptions" aria-label="Filtrar por situação da assinatura" class="w-full sm:w-48" />
          </div>
        </div>
        <div class="relative w-full sm:max-w-md">
          <Search class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input v-model="search" aria-label="Buscar conta" placeholder="Buscar por nome, e-mail ou CNPJ" class="h-10 pl-10 text-sm" />
        </div>
      </div>

      <div v-if="accountsError" class="flex flex-wrap items-center justify-between gap-3 p-5 text-sm" role="alert">
        <p class="text-destructive">{{ apiErrorMessage(accountsError, { default: 'Não foi possível carregar as contas.' }) }}</p>
        <Button variant="outline" size="sm" @click="refreshAccounts">Tentar novamente</Button>
      </div>
      <div v-else-if="accountsStatus === 'pending'" class="p-8 text-center text-sm text-muted-foreground" aria-live="polite">Carregando contas…</div>
      <div v-else-if="!accounts.length" class="m-4 rounded-2xl border border-dashed border-input bg-card px-5 py-10 text-center">
        <Building2 class="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden="true" />
        <h3 class="font-semibold">Nenhuma conta encontrada</h3>
        <p class="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Ajuste a busca ou os filtros para encontrar uma conta.</p>
        <Button variant="outline" class="mt-4" @click="search = ''; type = 'all'; status = 'all'">Limpar filtros</Button>
      </div>
      <div v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[820px] border-collapse text-sm">
            <thead class="bg-[#FAFBFF] text-left font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">
              <tr>
                <th class="px-5 py-3 font-medium">Conta</th><th class="px-4 py-3 font-medium">Tipo</th><th class="px-4 py-3 font-medium">Plano</th><th class="px-4 py-3 font-medium">Situação</th><th class="px-4 py-3 font-medium">Próxima cobrança</th><th class="px-4 py-3 font-medium">Convite inicial</th><th class="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in accounts" :key="account.id" class="border-t border-[#EFF2FB] transition-colors hover:bg-[#F7F8FE]">
                <td class="max-w-[240px] px-5 py-3.5">
                  <span class="block truncate font-semibold">{{ account.name }}</span>
                  <span class="block truncate text-xs text-muted-foreground">{{ account.ownerEmail || account.cnpj || '—' }}</span>
                </td>
                <td class="px-4 py-3.5">{{ account.type === 'clinic' ? 'Clínica' : 'Consultório' }}</td>
                <td class="px-4 py-3.5">{{ planLabel(account.planCode) }}<span v-if="account.billingCycle" class="block text-xs text-muted-foreground">{{ account.billingCycle === 'annual' ? 'Anual' : account.billingCycle === 'monthly' ? 'Mensal' : account.billingCycle }}</span></td>
                <td class="px-4 py-3.5"><span class="inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-medium" :class="subscriptionClasses(account.subscriptionStatus)">{{ subscriptionLabel(account.subscriptionStatus, account.initialInvitationStatus) }}</span></td>
                <td class="px-4 py-3.5 font-mono text-xs text-secondary-foreground">{{ formatDate(account.currentPeriodEnd || account.trialEndsAt) }}</td>
                <td class="px-4 py-3.5"><span v-if="account.type === 'clinic'" class="text-xs" :class="account.initialInvitationStatus === 'pending' ? 'font-medium text-[#9E3522]' : 'text-muted-foreground'">{{ invitationStatusLabel(account.initialInvitationStatus) }}</span><span v-else class="text-muted-foreground">—</span></td>
                <td class="px-5 py-3 text-right">
                  <div v-if="canManageInvitation(account)" class="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label="Ver convite inicial" title="Ver convite" @click="showInvitation(account)"><Eye class="size-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label="Reenviar convite inicial" title="Reenviar convite" @click="askResend(account)"><Mail class="size-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label="Cancelar criação da clínica" title="Cancelar criação" class="text-destructive hover:text-destructive" @click="askCancel(account)"><X class="size-4" /></Button>
                  </div>
                  <span v-else class="text-xs text-muted-foreground">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="divide-y divide-[#EFF2FB] md:hidden">
          <li v-for="account in accounts" :key="account.id" class="flex flex-col gap-3 p-4">
            <div class="flex min-w-0 items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate font-semibold">{{ account.name }}</h3>
                <p class="truncate text-xs text-muted-foreground">{{ account.ownerEmail || account.cnpj || '—' }}</p>
              </div>
              <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" :class="subscriptionClasses(account.subscriptionStatus)">{{ subscriptionLabel(account.subscriptionStatus, account.initialInvitationStatus) }}</span>
            </div>
            <dl class="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div><dt class="label-mono">Tipo</dt><dd class="mt-1">{{ account.type === 'clinic' ? 'Clínica' : 'Consultório' }}</dd></div>
              <div><dt class="label-mono">Plano</dt><dd class="mt-1">{{ planLabel(account.planCode) }}</dd></div>
              <div><dt class="label-mono">Próxima cobrança</dt><dd class="mt-1 font-mono">{{ formatDate(account.currentPeriodEnd || account.trialEndsAt) }}</dd></div>
              <div v-if="account.type === 'clinic'"><dt class="label-mono">Convite inicial</dt><dd class="mt-1">{{ invitationStatusLabel(account.initialInvitationStatus) }}</dd></div>
            </dl>
            <div v-if="canManageInvitation(account)" class="flex flex-wrap gap-2 border-t border-border pt-2">
              <Button variant="outline" size="sm" @click="showInvitation(account)"><Eye class="size-4" />Ver convite</Button>
              <Button variant="outline" size="sm" @click="askResend(account)"><Mail class="size-4" />Reenviar</Button>
              <Button variant="ghost" size="sm" class="text-destructive" @click="askCancel(account)"><X class="size-4" />Cancelar</Button>
            </div>
          </li>
        </ul>
      </div>

      <footer v-if="total > 0" class="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
        <span class="text-xs text-muted-foreground">{{ rangeStart }}–{{ rangeEnd }} de {{ total }}</span>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" :disabled="offset === 0" aria-label="Página anterior" @click="offset = Math.max(0, offset - PAGE_SIZE)"><ChevronLeft class="size-4" /><span class="hidden sm:inline">Anterior</span></Button>
          <span class="min-w-16 text-center font-mono text-xs text-muted-foreground">{{ page }} / {{ pageCount }}</span>
          <Button variant="outline" size="sm" :disabled="offset + PAGE_SIZE >= total" aria-label="Próxima página" @click="offset += PAGE_SIZE"><span class="hidden sm:inline">Próxima</span><ChevronRight class="size-4" /></Button>
        </div>
      </footer>
    </Card>
  </main>

  <Dialog :open="dialogMode !== 'closed'" @update:open="open => !open && closeDialog()">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      <template v-if="dialogMode === 'create'">
        <DialogHeader>
          <DialogTitle>Criar clínica</DialogTitle>
          <DialogDescription>Cadastre os dados da clínica e da responsável. Ela receberá um convite inicial por e-mail.</DialogDescription>
        </DialogHeader>
        <form class="flex flex-col gap-4" @submit.prevent="createClinic">
          <div class="flex flex-col gap-1.5">
            <label for="clinic-name" class="text-sm font-medium">Nome da clínica</label>
            <Input id="clinic-name" v-model="form.name" :aria-invalid="!!errors.name" :aria-describedby="errors.name ? 'clinic-name-error' : undefined" autocomplete="organization" placeholder="Ex.: Clínica Horizonte" />
            <p v-if="errors.name" id="clinic-name-error" class="text-[13px] text-destructive">{{ errors.name }}</p>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="clinic-cnpj" class="text-sm font-medium">CNPJ</label>
<Input id="clinic-cnpj" :model-value="form.cnpj" :aria-invalid="!!errors.cnpj" :aria-describedby="errors.cnpj ? 'clinic-cnpj-error' : undefined" inputmode="text" autocomplete="off" placeholder="00.000.000/0000-00" @update:model-value="form.cnpj = cnpjMask(String($event))" />
            <p v-if="errors.cnpj" id="clinic-cnpj-error" class="text-[13px] text-destructive">{{ errors.cnpj }}</p>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="clinic-owner-email" class="text-sm font-medium">E-mail da responsável</label>
            <Input id="clinic-owner-email" v-model="form.ownerEmail" :aria-invalid="!!errors.ownerEmail" :aria-describedby="errors.ownerEmail ? 'clinic-owner-email-error' : undefined" type="email" autocomplete="email" placeholder="nome@clinica.com.br" />
            <p v-if="errors.ownerEmail" id="clinic-owner-email-error" class="text-[13px] text-destructive">{{ errors.ownerEmail }}</p>
          </div>
          <fieldset class="flex flex-col gap-2">
            <legend class="text-sm font-medium">A responsável também atende?</legend>
            <RadioCardGroup v-model="ownerAttendsChoice" label="A responsável também atende?" :options="ownerAttendsOptions" />
          </fieldset>
          <p v-if="formError" class="rounded-lg bg-destructive/5 p-3 text-sm text-destructive" role="alert">{{ formError }}</p>
          <DialogFooter class="flex-col-reverse sm:flex-row">
            <Button type="button" variant="outline" :disabled="formBusy" @click="closeDialog">Fechar</Button>
            <Button type="submit" :loading="formBusy">Criar clínica</Button>
          </DialogFooter>
        </form>
      </template>

      <template v-else-if="dialogMode === 'platform-invite'">
        <DialogHeader><DialogTitle>Convidar admin da plataforma</DialogTitle><DialogDescription>Envie um convite para uma pessoa da equipe Acolhe acessar o painel administrativo.</DialogDescription></DialogHeader>
        <form class="flex flex-col gap-4" @submit.prevent="sendPlatformInvite">
          <div class="flex flex-col gap-1.5">
            <label for="platform-invite-email" class="text-sm font-medium">E-mail</label>
            <Input id="platform-invite-email" v-model="platformInviteEmail" type="email" autocomplete="email" placeholder="nome@acolhe.com.br" />
          </div>
          <p v-if="formError" class="text-sm text-destructive" role="alert">{{ formError }}</p>
          <DialogFooter class="flex-col-reverse sm:flex-row"><Button type="button" variant="outline" :disabled="formBusy" @click="closeDialog">Cancelar</Button><Button type="submit" :loading="formBusy">Enviar convite</Button></DialogFooter>
        </form>
      </template>

      <template v-else-if="dialogMode === 'invitation'">
        <DialogHeader><DialogTitle>Convite inicial</DialogTitle><DialogDescription>{{ selectedAccount?.name }}</DialogDescription></DialogHeader>
        <div v-if="invitationLoading" class="py-6 text-center text-sm text-muted-foreground">Consultando convite…</div>
        <div v-else-if="invitation" class="flex flex-col gap-4 rounded-xl bg-muted/60 p-4 text-sm">
          <div><p class="label-mono">Responsável</p><p class="mt-1 break-all font-medium">{{ invitation.ownerEmail }}</p></div>
          <div class="grid grid-cols-2 gap-4">
            <div><p class="label-mono">Status</p><p class="mt-1">{{ invitationStatusLabel(invitation.status) }}</p></div>
            <div><p class="label-mono">Expira em</p><p class="mt-1 font-mono">{{ formatDate(invitation.expiresAt) }}</p></div>
          </div>
          <div><p class="label-mono">Envio</p><p class="mt-1">{{ deliveryLabel(invitation.deliveryStatus) }}</p></div>
        </div>
        <p v-if="formError" class="text-sm text-destructive" role="alert">{{ formError }}</p>
        <DialogFooter><Button variant="outline" @click="closeDialog">Fechar</Button></DialogFooter>
      </template>

      <template v-else-if="dialogMode === 'resend'">
        <DialogHeader><DialogTitle>Reenviar convite inicial?</DialogTitle><DialogDescription>Um novo e-mail será enviado para {{ selectedAccount?.ownerEmail || 'a responsável' }}. O convite anterior deixará de ser válido.</DialogDescription></DialogHeader>
        <p v-if="formError" class="text-sm text-destructive" role="alert">{{ formError }}</p>
        <DialogFooter class="flex-col-reverse sm:flex-row"><Button variant="outline" :disabled="formBusy" @click="closeDialog">Voltar</Button><Button :loading="formBusy" @click="resendInvitation">Reenviar convite</Button></DialogFooter>
      </template>

      <template v-else-if="dialogMode === 'cancel'">
        <DialogHeader><DialogTitle>Cancelar criação da clínica?</DialogTitle><DialogDescription>O convite será invalidado e o CNPJ ficará disponível para um novo cadastro. Esta ação não pode ser desfeita.</DialogDescription></DialogHeader>
        <div class="flex flex-col gap-1.5">
          <label for="cancel-reason" class="text-sm font-medium">Motivo do cancelamento</label>
          <textarea id="cancel-reason" v-model="cancelReason" rows="3" maxlength="500" class="min-h-24 w-full resize-y rounded-xl border border-input bg-card px-3.5 py-3 text-sm placeholder:text-placeholder focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15" placeholder="Registre o motivo para auditoria" />
          <span class="text-right text-xs text-muted-foreground">{{ cancelReason.length }}/500</span>
        </div>
        <p v-if="formError" class="text-sm text-destructive" role="alert">{{ formError }}</p>
        <DialogFooter class="flex-col-reverse sm:flex-row"><Button variant="outline" :disabled="formBusy" @click="closeDialog">Voltar</Button><Button variant="destructive" :loading="formBusy" @click="cancelClinic">Cancelar criação</Button></DialogFooter>
      </template>

      <template v-else-if="dialogMode === 'result'">
        <DialogHeader><DialogTitle>{{ resultType === 'platform' || resultDelivery === 'sent' ? 'Convite enviado' : 'Clínica criada' }}</DialogTitle><DialogDescription>{{ resultDelivery === 'sent' ? 'A pessoa convidada receberá o convite no e-mail informado.' : deliveryLabel(resultDelivery) + '. Você pode compartilhar o link de convite abaixo.' }}</DialogDescription></DialogHeader>
        <div v-if="resultLink" class="flex flex-col gap-3 rounded-xl bg-accent p-4">
          <label for="invite-link" class="label-mono text-accent-foreground">Link do convite</label>
          <Input id="invite-link" :model-value="resultLink" readonly class="bg-white text-xs" />
          <Button variant="outline" class="self-start" @click="copyLink">{{ copied ? 'Link copiado' : 'Copiar link' }}</Button>
        </div>
        <p v-else class="text-sm text-muted-foreground">O link não veio na resposta do serviço. Consulte o convite na lista para acompanhar o status.</p>
        <p v-if="formError" class="text-sm text-destructive" role="alert">{{ formError }}</p>
        <DialogFooter><Button @click="closeDialog">Concluir</Button></DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>
