<script setup lang="ts">
import { Check, Copy, Send } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import type { PatientInvitation } from '~/types'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const patientId = computed(() => route.params.id as string)

const { data: patient } = usePatient(patientId)
const { data: activities } = usePatientActivities(patientId)
const { data: checkins, status: checkinsStatus, error: checkinsError } = usePatientCheckins(patientId)
const { data: appointments } = useAppointments()
const nextAppointment = computed(() => (appointments.value ?? [])
  .filter(a => a.patientId === patientId.value && ['scheduled', 'confirmed'].includes(a.status) && new Date(a.scheduledFor) >= new Date())
  .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))[0])
const isActive = computed(() =>
  patient.value?.status === 'active' && patient.value?.relationshipStatus === 'active',
)
const isPending = computed(() => patient.value?.relationshipStatus === 'pending')
const invitation = ref<PatientInvitation>()
const isGeneratingInvitation = ref(false)
const invitationCopied = ref(false)
const showPhone = ref(false)

async function copyInvitationUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    invitationCopied.value = true
    toast.success('Link do convite copiado.')
  }
  catch {
    toast.error('Não foi possível copiar automaticamente. Selecione o link exibido.')
  }
}

const invitationDelivery = computed(() => invitationDeliveryMeta(invitation.value?.deliveryStatus))

// Gera um novo link (o anterior deixa de valer) e, se o e-mail estiver
// configurado, reenvia. Só copia automaticamente quando o link é o caminho principal.
async function reissueInvitation() {
  if (!isPending.value || isGeneratingInvitation.value) return
  isGeneratingInvitation.value = true
  invitationCopied.value = false
  try {
    const generated = await $fetch<PatientInvitation>(`/api/patients/${patientId.value}/invitation`, {
      method: 'POST',
    })
    invitation.value = generated
    const meta = invitationDeliveryMeta(generated.deliveryStatus)
    toast.success(meta.toast)
    if (meta.showLink) await copyInvitationUrl(generated.url)
  }
  catch (error) {
    toast.error(apiErrorMessage(error, {
      404: 'Não há convite pendente para esta paciente. Ela pode já ter aceitado.',
      default: 'Não foi possível gerar um novo convite agora.',
    }))
  }
  finally {
    isGeneratingInvitation.value = false
  }
}

watch(patientId, () => {
  invitation.value = undefined
  invitationCopied.value = false
  showPhone.value = false
})

// Humor e atividades respondidas saem dos check-ins e das atividades da paciente.
const mood = computed(() => moodSummary(checkins.value ?? []))
const response = computed(() => activityResponse(activities.value ?? []))
const activeActivities = computed(() =>
  (activities.value ?? []).filter((a) => ['pending', 'in_progress', 'submitted'].includes(a.status)),
)
const consentLabel = computed(() => {
  const consent = patient.value?.healthConsent
  if (!consent) return 'Sem registro'
  const version = consent.version.startsWith('v') ? consent.version : `v${consent.version}`
  const detail = `${version} · ${formatDate(consent.decidedAt)}`
  return consent.accepted ? detail : `Não aceito · ${detail}`
})
</script>

<template>
  <PatientShell :patient="patient ?? null" :patient-id="patientId" active="overview">
    <!-- Visão geral -->
    <div v-if="isActive" class="flex flex-col gap-6">
      <Card role="region" aria-labelledby="ficha-humor" class="animate-fade flex flex-col gap-4 p-6">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ficha-humor" class="label-mono">Humor · últimos 30 dias</h2>
          <span v-if="mood.avgLabel" class="text-sm text-secondary-foreground">
            <strong class="text-[22px] font-semibold text-foreground">{{ mood.avgLabel }}</strong> de 5 em média
          </span>
        </div>
        <Sparkline
          v-if="mood.count >= 2"
          :values="mood.series"
          :width="600"
          :height="120"
          :min="1"
          :max="5"
          :stroke-width="2.5"
          guides
          role="img"
          :aria-label="`Humor dos check-ins dos últimos 30 dias: média ${mood.avgLabel} de 5 em ${mood.count} registros`"
          class="h-[120px] w-full text-primary"
        />
        <p v-else-if="checkinsStatus === 'pending'" class="text-sm text-muted-foreground" role="status">Carregando check-ins…</p>
        <p v-else-if="checkinsError" class="text-sm">
          {{ apiErrorMessage(checkinsError, { 403: 'Seu vínculo precisa estar ativo para consultar o humor.', default: 'Não foi possível carregar os check-ins desta paciente.' }) }}
        </p>
        <EmptyState v-else compact>
          {{ mood.count ? 'Só um check-in nos últimos 30 dias. O gráfico aparece a partir de dois.' : 'Nenhum check-in nos últimos 30 dias.' }}
        </EmptyState>
        <p class="text-xs text-muted-foreground">Média dos check-ins diários feitos pela paciente.</p>
      </Card>

      <NuxtIsland name="PatientTimeline" lazy :props="{ patientId }">
        <template #fallback>
          <Card class="flex flex-col gap-3 p-6">
            <p class="label-mono">Linha do tempo</p>
            <div class="h-24 animate-pulse rounded-lg bg-secondary" />
          </Card>
        </template>
      </NuxtIsland>
    </div>

    <EmptyState
      v-else-if="patient"
      class="animate-fade"
      :title="isPending ? 'Aguardando aceite' : 'Vínculo não está ativo'"
      :description="isPending
        ? 'Os dados clínicos ficam indisponíveis até a paciente aceitar o convite e o consentimento.'
        : 'Os dados clínicos ficam indisponíveis enquanto o vínculo não estiver ativo.'"
    >
      <template v-if="isPending" #action>
        <div class="flex w-full max-w-md flex-col items-center gap-3">
          <template v-if="!invitation">
            <p class="text-xs text-muted-foreground">
              Um novo link é gerado e enviado por e-mail; qualquer link anterior deixa de funcionar.
            </p>
            <Button type="button" variant="outline" :loading="isGeneratingInvitation" @click="reissueInvitation">
              <Send v-if="!isGeneratingInvitation" />
              Reenviar convite
            </Button>
          </template>

          <template v-else>
            <InlineNotice :tone="invitationDelivery.tone === 'warning' ? 'warning' : 'positive'" class="text-left">
              {{ invitationDelivery.showLink
                ? invitationDelivery.short
                : `E-mail reenviado para ${invitation.email}.` }}
              Válido até {{ formatDateTime(invitation.expiresAt) }}. O link anterior deixou de valer.
            </InlineNotice>
            <div v-if="invitationDelivery.showLink" class="flex w-full gap-2">
              <Input :model-value="invitation.url" readonly aria-label="Link do convite" class="min-w-0 text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copiar convite"
                @click="copyInvitationUrl(invitation.url)"
              >
                <Check v-if="invitationCopied" />
                <Copy v-else />
              </Button>
            </div>
            <Button v-else type="button" variant="ghost" size="sm" @click="copyInvitationUrl(invitation.url)">
              <Check v-if="invitationCopied" />
              <Copy v-else />
              Copiar link por outro canal
            </Button>
          </template>
        </div>
      </template>
    </EmptyState>

    <!-- Coluna lateral -->
    <template #aside>
      <section
        v-if="isActive && nextAppointment"
        aria-labelledby="ficha-proxima"
        class="animate-fade flex flex-col gap-2.5 rounded-2xl bg-brand p-6 text-brand-foreground"
      >
        <h2 id="ficha-proxima" class="label-mono text-brand-muted">Próxima sessão</h2>
        <p class="text-2xl font-semibold tracking-[-0.02em] text-white">{{ sessionWhenLabel(nextAppointment.scheduledFor) }}</p>
        <p class="text-sm text-brand-muted">
          {{ modalityLabel(nextAppointment.modality) }} · {{ nextAppointment.durationMinutes }} min · {{ appointmentStatusLabel(nextAppointment.status).toLowerCase() }}
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <Button variant="on-brand" size="sm" as-child>
            <NuxtLink :to="`/appointments/${nextAppointment.id}`">Ver sessão</NuxtLink>
          </Button>
          <NewSessionDialog :appointment="nextAppointment">
            <Button variant="on-brand-outline" size="sm">Reagendar</Button>
          </NewSessionDialog>
        </div>
      </section>

      <Card v-if="isActive" role="region" aria-labelledby="ficha-respondidas" class="animate-fade flex flex-col gap-3 p-6">
        <h2 id="ficha-respondidas" class="label-mono">Atividades respondidas</h2>
        <span class="text-[28px] font-semibold leading-none tracking-[-0.03em]">
          {{ response.pct == null ? '—' : `${response.pct}%` }}
        </span>
        <Progress :model-value="response.pct ?? 0" class="h-2" aria-hidden="true" />
        <span class="text-[13px] text-muted-foreground">
          {{ response.total
            ? `${response.responded} de ${response.total} ${response.total === 1 ? 'atribuída' : 'atribuídas'}`
            : 'Nenhuma atividade atribuída ainda.' }}
        </span>
      </Card>

      <Card v-if="isActive" role="region" aria-labelledby="ficha-ativas" class="animate-fade flex flex-col gap-3 p-6">
        <h2 id="ficha-ativas" class="label-mono">Atividades ativas · {{ activeActivities.length }}</h2>
        <ul v-if="activeActivities.length" class="-mx-2 flex flex-col">
          <li v-for="a in activeActivities" :key="a.id">
            <NuxtLink
              :to="`/activities/${a.id}`"
              class="flex flex-col gap-0.5 rounded-lg px-2 py-2 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              <span class="text-sm font-medium">{{ a.title }}</span>
              <span v-if="a.summary" class="text-[13px] text-muted-foreground">{{ a.summary }}</span>
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">Nenhuma atividade ativa.</p>
      </Card>

      <Card role="region" aria-labelledby="ficha-identificacao" class="animate-fade flex flex-col gap-3 p-6 text-sm">
        <h2 id="ficha-identificacao" class="label-mono">Identificação</h2>
        <dl class="flex flex-col gap-3">
          <div class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">E-mail</dt>
            <dd class="min-w-0 text-right [overflow-wrap:anywhere]">{{ patient?.email || 'Não informado' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">Telefone</dt>
            <dd class="min-w-0 text-right">
              <!-- Mascarado como no protótipo; um clique mostra o número inteiro. -->
              <button
                v-if="patient?.phone"
                type="button"
                class="rounded text-right underline-offset-[3px] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                :aria-label="showPhone ? 'Ocultar telefone' : 'Mostrar telefone completo'"
                @click="showPhone = !showPhone"
              >
                {{ showPhone ? patient.phone : maskPhone(patient.phone) }}
              </button>
              <template v-else>Não informado</template>
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">Consentimento</dt>
            <dd class="min-w-0 text-right">{{ consentLabel }}</dd>
          </div>
        </dl>
      </Card>
    </template>
  </PatientShell>
</template>
