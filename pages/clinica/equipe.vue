<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ClinicInvitationResult, ClinicMember, ClinicTeam } from '~/schemas/clinic'
import type { User } from '~/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Equipe da clínica (ACO-62): vínculos e convites. Ações sem volta passam por
// confirmação (regra do ConfirmDialog). Ninguém altera o próprio vínculo; só a
// responsável altera responsáveis (ADR 0002 da API).
definePageMeta({ middleware: ['auth', 'clinic-admin'] })

const { data: me } = useNuxtData<User | null>('me')
const isOwner = computed(() => me.value?.workspace?.roles.includes('clinic_owner') ?? false)
const { data: team, error, status, refresh } = useFetch<ClinicTeam>('/api/clinic/team', {
  key: 'clinic-team',
  default: () => ({ members: [], invitations: [] }),
})
const members = computed(() => team.value?.members ?? [])
const invitations = computed(() => team.value?.invitations ?? [])
const busy = ref(false)
const resent = ref<ClinicInvitationResult | null>(null)

type Change = 'suspend' | 'reactivate' | 'end'
const confirmations: Record<Change, { title: string, description: string, confirmLabel: string, destructive: boolean }> = {
  suspend: { title: 'Suspender acesso?', description: 'A pessoa perde o acesso à clínica na hora. Nada é apagado e você pode reativar depois.', confirmLabel: 'Suspender', destructive: true },
  reactivate: { title: 'Reativar acesso?', description: 'A pessoa volta a acessar a clínica.', confirmLabel: 'Reativar', destructive: false },
  end: { title: 'Encerrar vínculo?', description: 'A pessoa deixa a clínica e perde o acesso. Pacientes e registros continuam na clínica. Esta ação não pode ser desfeita.', confirmLabel: 'Encerrar vínculo', destructive: true },
}
const pending = ref<{ member: ClinicMember, change: Change } | null>(null)
const pendingRevoke = ref<string | null>(null)
const confirmation = computed(() => pending.value ? confirmations[pending.value.change] : null)

function canManage(member: ClinicMember) {
  if (member.userId === me.value?.id || member.status === 'ended') return false
  return isOwner.value || !member.roles.includes('clinic_owner')
}
function changesFor(member: ClinicMember): Change[] {
  return member.status === 'active' ? ['suspend', 'end'] : member.status === 'suspended' ? ['reactivate', 'end'] : []
}
const changeLabel: Record<Change, string> = { suspend: 'Suspender', reactivate: 'Reativar', end: 'Encerrar' }

async function decide(confirmed: boolean) {
  const target = pending.value
  pending.value = null
  if (!confirmed || !target || busy.value) return
  busy.value = true
  try {
    await $fetch(`/api/clinic/members/${target.member.userId}/${target.change}`, { method: 'POST', body: {} })
    toast.success('Vínculo atualizado.')
    await refresh()
  }
  catch (err) {
    toast.error(clinicErrorMessage(err))
  }
  finally {
    busy.value = false
  }
}

async function resend(id: string) {
  if (busy.value) return
  busy.value = true
  try {
    resent.value = await $fetch<ClinicInvitationResult>(`/api/clinic/invitations/${id}/resend`, { method: 'POST' })
    await refresh()
  }
  catch (err) {
    toast.error(clinicErrorMessage(err))
  }
  finally {
    busy.value = false
  }
}

async function decideRevoke(confirmed: boolean) {
  const id = pendingRevoke.value
  pendingRevoke.value = null
  if (!confirmed || !id || busy.value) return
  busy.value = true
  try {
    await $fetch(`/api/clinic/invitations/${id}/revoke`, { method: 'POST' })
    toast.success('Convite cancelado.')
    await refresh()
  }
  catch (err) {
    toast.error(clinicErrorMessage(err))
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <PageHeader title="Equipe">
    <template #actions>
      <InviteMemberDialog :can-invite-owner="isOwner" @invited="refresh()">
        <Button size="sm">Convidar</Button>
      </InviteMemberDialog>
    </template>
  </PageHeader>
  <div class="flex flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
    <div v-if="error" class="flex flex-col items-start gap-3 text-sm" role="alert">
      <p class="text-destructive">{{ clinicErrorMessage(error, 'Não foi possível carregar a equipe.') }}</p>
      <Button variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <p v-else-if="status === 'pending'" class="text-sm text-muted-foreground">Carregando equipe…</p>
    <template v-else>
      <section class="flex flex-col gap-3">
        <p class="label-mono">Profissionais · {{ members.length }}</p>
        <ul class="divide-y rounded-xl border bg-card">
          <li v-for="member in members" :key="member.userId" class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ member.fullName ?? member.email }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ member.email }} · {{ member.roles.map(workspaceRoleLabel).join(', ') }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{{ membershipStatusLabel(member.status) }}</Badge>
              <template v-if="canManage(member)">
                <Button
                  v-for="change in changesFor(member)"
                  :key="change"
                  variant="outline"
                  size="sm"
                  :disabled="busy"
                  @click="pending = { member, change }"
                >
                  {{ changeLabel[change] }}
                </Button>
              </template>
            </div>
          </li>
        </ul>
      </section>
      <section class="flex flex-col gap-3">
        <p class="label-mono">Convites pendentes · {{ invitations.length }}</p>
        <EmptyState v-if="!invitations.length" compact>Nenhum convite pendente.</EmptyState>
        <ul v-else class="divide-y rounded-xl border bg-card">
          <li v-for="invitation in invitations" :key="invitation.id" class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ invitation.email }}</p>
              <p class="text-xs text-muted-foreground">{{ invitation.roles.map(workspaceRoleLabel).join(', ') }} · vale até {{ formatDateTime(invitation.expiresAt) }}</p>
            </div>
            <div v-if="isOwner || !invitation.roles.includes('clinic_owner')" class="flex gap-2">
              <Button variant="outline" size="sm" :disabled="busy" @click="resend(invitation.id)">Reenviar</Button>
              <Button variant="outline" size="sm" :disabled="busy" @click="pendingRevoke = invitation.id">Cancelar</Button>
            </div>
          </li>
        </ul>
      </section>
    </template>
    <ConfirmDialog
      :open="pending !== null"
      :title="confirmation?.title ?? ''"
      :description="confirmation?.description ?? ''"
      :confirm-label="confirmation?.confirmLabel ?? ''"
      :destructive="confirmation?.destructive"
      @decision="decide"
    />
    <InvitationLinkDialog :result="resent" @close="resent = null" />
    <ConfirmDialog
      :open="pendingRevoke !== null"
      title="Cancelar convite?"
      description="O link deixa de funcionar. Você pode convidar de novo depois."
      confirm-label="Cancelar convite"
      cancel-label="Manter"
      destructive
      @decision="decideRevoke"
    />
  </div>
</template>
