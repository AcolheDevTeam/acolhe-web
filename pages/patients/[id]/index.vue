<script setup lang="ts">
import { Check, Copy, LoaderCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { PatientInvitationResult } from '~/types'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const patientId = computed(() => route.params.id as string)

const { data: patient } = usePatient(patientId)
const { data: activities } = usePatientActivities(patientId)
const isActive = computed(() =>
  patient.value?.status === 'active' && patient.value?.relationshipStatus === 'active',
)
const isPending = computed(() => patient.value?.relationshipStatus === 'pending')
const invitation = ref<PatientInvitationResult>()
const isGeneratingInvitation = ref(false)
const invitationCopied = ref(false)

function invitationMessage(status: string) {
  if (status === 'sent') return 'E-mail enviado.'
  if (status === 'queued') return 'E-mail na fila de envio.'
  return 'E-mail não enviado; use o link copiado.'
}

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

async function generateAndCopyInvitation() {
  if (!isPending.value || isGeneratingInvitation.value) return
  isGeneratingInvitation.value = true
  invitationCopied.value = false
  try {
    const generated = await $fetch<PatientInvitationResult>(`/api/patients/${patientId.value}/invitation`, {
      method: 'POST',
    })
    invitation.value = generated
    await copyInvitationUrl(generated.copyLink)
  }
  catch {
    toast.error('Não foi possível gerar um novo link de convite.')
  }
  finally {
    isGeneratingInvitation.value = false
  }
}

watch(patientId, () => {
  invitation.value = undefined
  invitationCopied.value = false
})

const activeActivities = computed(() =>
  (activities.value ?? []).filter((a) => ['pending', 'in_progress', 'submitted'].includes(a.status)),
)
const identity = computed(() => {
  const p = patient.value
  return [
    { label: 'E-mail', value: p?.email },
    { label: 'Telefone', value: p?.phone },
    { label: 'Vínculo', value: p?.bond },
    {
      label: 'Consentimento',
      value: p?.consentVersion ? `${p.consentVersion} · ${formatDate(p.consentDate)}` : undefined,
    },
  ]
})
</script>

<template>
  <PatientShell :patient="patient ?? null" :patient-id="patientId" active="overview">
    <!-- Visão geral -->
    <div v-if="isActive" class="flex flex-col gap-8">
      <div class="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent class="flex flex-col gap-3 pt-6">
            <div class="flex items-baseline justify-between">
              <p class="label-mono">Humor diário</p>
              <span class="text-xs text-muted-foreground">30 dias</span>
            </div>
            <p class="font-serif text-3xl leading-none">
              {{ patient?.moodAvg ?? '—' }} <span class="text-base text-muted-foreground">/ 10</span>
            </p>
            <Sparkline :values="patient?.moodSeries" :width="220" :height="40" class="w-full" />
            <p class="text-xs text-muted-foreground">
              Apresentação descritiva. Não substitui julgamento clínico.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="flex flex-col gap-3 pt-6">
            <div class="flex items-baseline justify-between">
              <p class="label-mono">Adesão a tarefas</p>
              <span class="text-xs text-muted-foreground">últimas 8 semanas</span>
            </div>
            <p class="font-serif text-3xl leading-none">
              {{ patient?.adherence == null ? '—' : `${patient.adherence}%` }}
            </p>
            <AdherenceBar :value="patient?.adherence" />
          </CardContent>
        </Card>
      </div>

      <NuxtIsland name="PatientTimeline" lazy :props="{ patientId }">
        <template #fallback>
          <section class="flex flex-col gap-3">
            <p class="label-mono">Linha do tempo</p>
            <div class="h-24 animate-pulse rounded-lg bg-muted" />
          </section>
        </template>
      </NuxtIsland>
    </div>
    <div
      v-else
      class="rounded-xl border border-dashed px-6 py-12 text-center"
    >
      <p class="font-serif text-2xl">Aguardando aceite</p>
      <p class="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Os dados clínicos permanecem indisponíveis enquanto o convite e o consentimento estiverem pendentes.
      </p>
      <div v-if="isPending" class="mx-auto mt-6 flex max-w-md flex-col items-center gap-3">
        <p v-if="!invitation" class="text-xs text-muted-foreground">
          Ao copiar, um novo link será gerado e qualquer link anterior deixará de funcionar.
        </p>
        <Button
          v-if="!invitation"
          type="button"
          variant="outline"
          :disabled="isGeneratingInvitation"
          @click="generateAndCopyInvitation"
        >
          <LoaderCircle v-if="isGeneratingInvitation" class="animate-spin" />
          <Copy v-else />
          Copiar convite
        </Button>
        <div v-else class="flex w-full gap-2">
          <Input :model-value="invitation.copyLink" readonly class="min-w-0 text-xs" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Copiar convite"
           @click="copyInvitationUrl(invitation.copyLink)"
          >
            <Check v-if="invitationCopied" />
            <Copy v-else />
          </Button>
        </div>
        <p v-if="invitation" class="text-xs text-muted-foreground">
           {{ invitationMessage(invitation.invitation.deliveryStatus) }} Válido até {{ formatDateTime(invitation.invitation.expiresAt) }}.
        </p>
      </div>
    </div>

    <!-- Coluna lateral -->
    <template #aside>
      <Card v-if="isActive && patient?.nextSession">
        <CardContent class="flex flex-col gap-3 pt-6">
          <p class="label-mono">Próxima sessão</p>
          <p class="font-serif text-2xl leading-tight">{{ formatDateTime(patient.nextSession.occurredAt) }}</p>
          <p class="text-sm text-muted-foreground">
            {{ modalityLabel(patient.nextSession.modality) }} · {{ patient.nextSession.durationMin }} min
          </p>
          <div class="mt-1 flex gap-2">
            <Button variant="outline" size="sm" class="flex-1">Reagendar</Button>
            <Button size="sm" class="flex-1">Iniciar</Button>
          </div>
        </CardContent>
      </Card>

      <section v-if="isActive" class="flex flex-col gap-3">
        <p class="label-mono">Atividades ativas · {{ activeActivities.length }}</p>
        <div v-if="activeActivities.length" class="flex flex-col gap-3">
          <NuxtLink
            v-for="a in activeActivities"
            :key="a.id"
            :to="`/activities/${a.id}`"
            class="flex flex-col gap-0.5"
          >
            <span class="text-sm font-medium">{{ a.title }}</span>
            <span class="text-xs text-muted-foreground">{{ a.summary }}</span>
          </NuxtLink>
        </div>
        <p v-else class="text-sm text-muted-foreground">Nenhuma atividade ativa.</p>
      </section>

      <Separator />

      <section class="flex flex-col gap-3">
        <p class="label-mono">Identificação</p>
        <dl class="flex flex-col gap-2 text-sm">
          <div v-for="row in identity" :key="row.label" class="flex justify-between gap-4">
            <dt class="text-muted-foreground">{{ row.label }}</dt>
            <dd class="text-right">{{ row.value ?? '—' }}</dd>
          </div>
        </dl>
      </section>
    </template>
  </PatientShell>
</template>
