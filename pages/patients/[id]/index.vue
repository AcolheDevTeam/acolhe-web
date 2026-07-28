<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const patientId = computed(() => route.params.id as string)

const { data: patient } = usePatient(patientId)
const { data: activities } = usePatientActivities(patientId)
// Timeline é leitura pura — lazy para não hidratar à toa (base da ACO-21).
const { data: timeline } = usePatientTimeline(patientId)

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
    <div class="flex flex-col gap-8">
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

      <section class="flex flex-col gap-3">
        <p class="label-mono">Linha do tempo</p>
        <ol v-if="timeline?.length" class="flex flex-col">
          <li
            v-for="(ev, i) in timeline"
            :key="ev.id"
            class="flex gap-4 border-l border-border pb-6 pl-4 last:pb-0"
            :class="{ 'border-transparent': i === timeline.length - 1 }"
          >
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ ev.title }}</span>
                <span class="text-xs text-muted-foreground">{{ formatDateTime(ev.at) }}</span>
              </div>
              <p v-if="ev.description" class="text-sm text-muted-foreground">{{ ev.description }}</p>
              <p v-if="ev.by" class="text-xs text-muted-foreground">por {{ ev.by }}</p>
            </div>
          </li>
        </ol>
        <p v-else class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Ainda não há eventos na linha do tempo.
        </p>
      </section>
    </div>

    <!-- Coluna lateral -->
    <template #aside>
      <Card v-if="patient?.nextSession">
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

      <section class="flex flex-col gap-3">
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
