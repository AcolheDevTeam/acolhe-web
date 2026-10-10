<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ClinicInvitationResult, ClinicMember, ClinicOverview, ClinicTeam } from '~/schemas/clinic'
import type { User } from '~/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Equipe da clínica (ACO-62), no layout do protótipo "Equipe": vínculos e
// convites pendentes na mesma tabela. Ações sem volta passam por confirmação
// (regra do ConfirmDialog). Ninguém altera o próprio vínculo; só a responsável
// altera responsáveis (ADR 0002 da API).
definePageMeta({ middleware: ['auth', 'clinic-admin'] })

const { data: me } = useNuxtData<User | null>('me')
const isOwner = computed(() => me.value?.workspace?.roles.includes('clinic_owner') ?? false)
const { workspaces } = useWorkspaces()
const clinicName = computed(() => workspaces.value.find(w => w.current)?.name ?? 'Clínica')
const { data: team, error, status, refresh } = useFetch<ClinicTeam>('/api/clinic/team', {
  key: clinicTeamKey(me.value?.workspace?.organizationId),
  default: () => ({ members: [], invitations: [] }),
})
// Nº de pacientes por pessoa vem do painel (só números); sem ele, a coluna mostra "—".
const { data: overview, refresh: refreshOverview } = useFetch<ClinicOverview>('/api/clinic/overview', {
  key: 'clinic-overview',
  default: () => ({ professionals: [] }),
})
const patientsByUser = computed(() => new Map((overview.value?.professionals ?? []).map(p => [p.userId, p.activePatients])))
const members = computed(() => team.value?.members ?? [])
const invitations = computed(() => team.value?.invitations ?? [])
const busy = ref(false)
const resent = ref<ClinicInvitationResult | null>(null)
const notice = ref('')

type Change = 'suspend' | 'reactivate' | 'end'
const confirmations: Record<Change, { title: string, description: string, confirmLabel: string, destructive: boolean }> = {
  suspend: { title: 'Suspender acesso?', description: 'A pessoa perde o acesso à clínica na hora. Nada é apagado e você pode reativar depois.', confirmLabel: 'Suspender', destructive: true },
  reactivate: { title: 'Reativar acesso?', description: 'A pessoa volta a acessar a clínica.', confirmLabel: 'Reativar', destructive: false },
  end: { title: 'Remover da equipe?', description: 'A pessoa deixa a clínica e perde o acesso. Pacientes e registros continuam na clínica. Esta ação não pode ser desfeita.', confirmLabel: 'Remover', destructive: true },
}
const doneMessage: Record<Change, string> = {
  suspend: 'Acesso suspenso. Nada foi apagado e você pode reativar quando quiser.',
  reactivate: 'Acesso reativado.',
  end: 'Acesso removido. Os pacientes e registros continuam na clínica.',
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
const changeLabel: Record<Change, string> = { suspend: 'Suspender', reactivate: 'Reativar', end: 'Remover' }
function statusVariant(status: string) {
  return status === 'active' ? 'positive' : status === 'suspended' ? 'warning' : 'neutral'
}

async function decide(confirmed: boolean) {
  const target = pending.value
  pending.value = null
  if (!confirmed || !target || busy.value) return
  busy.value = true
  notice.value = ''
  try {
    await $fetch(`/api/clinic/members/${target.member.userId}/${target.change}`, { method: 'POST', body: {} })
    notice.value = doneMessage[target.change]
    await Promise.all([refresh(), refreshOverview()])
  }
  catch (err) {
    // Inclui a proteção da última responsável (409), que só o servidor conhece.
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
  notice.value = ''
  try {
    await $fetch(`/api/clinic/invitations/${id}/revoke`, { method: 'POST' })
    notice.value = 'Convite cancelado. Você pode convidar de novo depois.'
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
  <PageHeader :eyebrow="clinicName" title="Equipe">
    <template #actions>
      <InviteMemberDialog :can-invite-owner="isOwner" @invited="refresh()">
        <Button><Plus />Convidar psicóloga(o)</Button>
      </InviteMemberDialog>
    </template>
  </PageHeader>
  <div class="flex flex-col gap-6 px-4 pb-14 pt-7 md:px-8 lg:px-12">
    <div v-if="error" class="flex flex-col items-start gap-3 text-sm" role="alert">
      <p class="text-destructive">{{ clinicErrorMessage(error, 'Não foi possível carregar a equipe.') }}</p>
      <Button variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <p v-else-if="status === 'pending'" class="text-sm text-muted-foreground">Carregando equipe…</p>
    <Card v-else role="region" aria-labelledby="t-membros" class="animate-rise overflow-hidden [animation-delay:.1s]">
      <h2 id="t-membros" class="px-[22px] pb-2 pt-5 text-lg font-semibold">Psicólogas(os)</h2>
      <!-- Celular: lista com as ações embaixo de cada pessoa (padrão de Pacientes). -->
      <ul class="flex flex-col divide-y divide-secondary md:hidden">
        <li v-for="member in members" :key="member.userId" class="flex animate-fade flex-col gap-3 px-[22px] py-3.5">
          <span class="flex items-center gap-3">
            <Avatar class="h-9 w-9 text-xs" aria-hidden="true"><AvatarFallback>{{ initials(member.fullName ?? member.email) }}</AvatarFallback></Avatar>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="truncate text-[15px] font-semibold">{{ member.fullName ?? member.email }}</span>
              <span class="truncate text-[13px] text-muted-foreground">{{ member.email }}</span>
            </span>
          </span>
          <span class="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-secondary-foreground">
            <Badge :variant="statusVariant(member.status)" class="h-6">{{ membershipStatusLabel(member.status) }}</Badge>
            <span>{{ member.roles.map(workspaceRoleLabel).join(', ') }}</span>
            <span v-if="patientsByUser.has(member.userId)">{{ patientsByUser.get(member.userId) }} pacientes</span>
          </span>
          <span v-if="canManage(member) && changesFor(member).length" class="-ml-3 flex flex-wrap gap-1">
            <Button
              v-for="change in changesFor(member)"
              :key="change"
              variant="ghost"
              size="sm"
              :class="change === 'end' ? 'text-warning hover:bg-warning-soft hover:text-warning' : 'text-primary hover:bg-positive-soft hover:text-primary'"
              :disabled="busy"
              @click="pending = { member, change }"
            >
              {{ changeLabel[change] }}
            </Button>
          </span>
        </li>
        <li v-for="invitation in invitations" :key="invitation.id" class="flex animate-fade flex-col gap-3 px-[22px] py-3.5">
          <span class="flex items-center gap-3">
            <Avatar tone="pending" class="h-9 w-9 text-xs" aria-hidden="true"><AvatarFallback>··</AvatarFallback></Avatar>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="truncate text-[15px] font-semibold">{{ invitation.email }}</span>
              <span class="truncate text-[13px] text-muted-foreground">Vale até {{ formatDateTime(invitation.expiresAt) }}</span>
            </span>
          </span>
          <span class="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-secondary-foreground">
            <Badge variant="warning" class="h-6">Convite pendente</Badge>
            <span>{{ invitation.roles.map(workspaceRoleLabel).join(', ') }}</span>
          </span>
          <span v-if="isOwner || !invitation.roles.includes('clinic_owner')" class="-ml-3 flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" class="text-primary hover:bg-positive-soft hover:text-primary" :disabled="busy" @click="resend(invitation.id)">Reenviar convite</Button>
            <Button variant="ghost" size="sm" class="text-warning hover:bg-warning-soft hover:text-warning" :disabled="busy" @click="pendingRevoke = invitation.id">Cancelar</Button>
          </span>
        </li>
      </ul>
      <Table class="hidden min-w-[680px] md:table">
        <TableHeader>
          <TableRow class="border-border hover:bg-transparent">
            <TableHead class="pl-[22px]">Nome</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Pacientes</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead class="pr-[22px]"><span class="sr-only">Ações</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(member, i) in members"
            :key="member.userId"
            class="animate-fade"
            :style="{ animationDelay: `${i * 0.05}s` }"
          >
            <TableCell class="pl-[22px]">
              <span class="flex items-center gap-3">
                <Avatar class="h-9 w-9 text-xs" aria-hidden="true"><AvatarFallback>{{ initials(member.fullName ?? member.email) }}</AvatarFallback></Avatar>
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="truncate text-[15px] font-semibold">{{ member.fullName ?? member.email }}</span>
                  <span class="truncate text-[13px] text-muted-foreground">{{ member.email }}</span>
                </span>
              </span>
            </TableCell>
            <TableCell>{{ member.roles.map(workspaceRoleLabel).join(', ') }}</TableCell>
            <TableCell class="font-mono">{{ patientsByUser.get(member.userId) ?? '—' }}</TableCell>
            <TableCell><Badge :variant="statusVariant(member.status)" class="h-6">{{ membershipStatusLabel(member.status) }}</Badge></TableCell>
            <TableCell class="whitespace-nowrap pr-[22px] text-right">
              <template v-if="canManage(member)">
                <Button
                  v-for="change in changesFor(member)"
                  :key="change"
                  variant="ghost"
                  size="sm"
                  :class="change === 'end' ? 'text-warning hover:bg-warning-soft hover:text-warning' : 'text-primary hover:bg-positive-soft hover:text-primary'"
                  :disabled="busy"
                  @click="pending = { member, change }"
                >
                  {{ changeLabel[change] }}
                </Button>
              </template>
            </TableCell>
          </TableRow>
          <TableRow
            v-for="(invitation, i) in invitations"
            :key="invitation.id"
            class="animate-fade"
            :style="{ animationDelay: `${(members.length + i) * 0.05}s` }"
          >
            <TableCell class="pl-[22px]">
              <span class="flex items-center gap-3">
                <Avatar tone="pending" class="h-9 w-9 text-xs" aria-hidden="true"><AvatarFallback>··</AvatarFallback></Avatar>
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="truncate text-[15px] font-semibold">{{ invitation.email }}</span>
                  <span class="truncate text-[13px] text-muted-foreground">Vale até {{ formatDateTime(invitation.expiresAt) }}</span>
                </span>
              </span>
            </TableCell>
            <TableCell>{{ invitation.roles.map(workspaceRoleLabel).join(', ') }}</TableCell>
            <TableCell class="font-mono">—</TableCell>
            <TableCell><Badge variant="warning" class="h-6">Convite pendente</Badge></TableCell>
            <TableCell class="whitespace-nowrap pr-[22px] text-right">
              <template v-if="isOwner || !invitation.roles.includes('clinic_owner')">
                <Button variant="ghost" size="sm" class="text-primary hover:bg-positive-soft hover:text-primary" :disabled="busy" @click="resend(invitation.id)">Reenviar convite</Button>
                <Button variant="ghost" size="sm" class="text-warning hover:bg-warning-soft hover:text-warning" :disabled="busy" @click="pendingRevoke = invitation.id">Cancelar</Button>
              </template>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <!-- Região viva sempre montada: só o texto muda, para o leitor de tela anunciar. -->
      <div role="status" aria-live="polite">
        <p v-if="notice" class="animate-fade border-t border-secondary px-[22px] py-3 text-[13px] leading-relaxed text-secondary-foreground">{{ notice }}</p>
      </div>
    </Card>
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
