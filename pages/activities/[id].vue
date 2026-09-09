<script setup lang="ts">
import { AlertTriangle, Check, FileText } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const activityId = computed(() => route.params.id as string)
const { data: activity, status, error } = useActivity(activityId)

const meta = computed(() => activityStatusMeta(activity.value?.status))
const reviewing = ref(false)
const submission = computed(() =>
  activity.value?.state === 'submitted' || activity.value?.state === 'reviewed'
    ? activity.value.submission
    : null,
)
const canReview = computed(() =>
  status.value === 'success'
  && activity.value?.state === 'submitted'
  && activity.value.submission.fields.length === activity.value.fieldCount,
)

function fieldTypeLabel(type: string) {
  const labels: Record<string, string> = {
    long_text: 'Texto longo',
    short_text: 'Texto curto',
    text: 'Texto',
    scale: 'Escala',
    number: 'Número',
    boolean: 'Sim ou não',
    datetime: 'Data e hora',
    multiple_choice: 'Múltipla escolha',
    choice: 'Escolha',
    file: 'Arquivo',
  }
  return labels[type] ?? type
}

function jsonValues(value: unknown) {
  if (Array.isArray(value)) return value.map(String)
  if (value && typeof value === 'object') return [JSON.stringify(value)]
  return [String(value)]
}

async function markReviewed() {
  reviewing.value = true
  try {
    await $fetch(`/api/activities/${activityId.value}/review`, {
      method: 'PUT',
    })
    toast.success('Atividade marcada como revisada.')
    await refreshNuxtData(`activity-${activityId.value}`)
  } catch {
    toast.error('Não foi possível concluir a revisão.')
  } finally {
    reviewing.value = false
  }
}
</script>

<template>
  <PageHeader>
    <template #title>
      <nav class="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <!-- No celular só o trecho final do caminho aparece. -->
        <NuxtLink to="/patients" class="hidden hover:text-foreground sm:inline">Pacientes</NuxtLink>
        <span class="hidden sm:inline">/</span>
        <NuxtLink
          v-if="activity?.patientId"
          :to="`/patients/${activity.patientId}/activities`"
          class="hover:text-foreground"
        >
          {{ activity?.patientName ?? 'Paciente' }}
        </NuxtLink>
        <span>/</span>
        <span class="min-w-0 truncate font-medium text-foreground">Atividade</span>
      </nav>
    </template>
    <template #actions>
      <Button
        v-if="canReview"
        size="sm"
        :disabled="reviewing"
        @click="markReviewed"
      >
        <Check />
        Marcar como revisada
      </Button>
    </template>
  </PageHeader>

  <div class="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
    <div v-if="activity" class="flex flex-col gap-7">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <h1 class="display-serif text-3xl">{{ activity.title }}</h1>
          <Badge :variant="meta.variant">{{ meta.label }}</Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          <template v-if="activity.patientName">{{ activity.patientName }} · </template>
          <template v-if="submission">respondida em {{ formatDateTime(submission.submittedAt) }}</template>
          <template v-else-if="activity.dueAt">prazo {{ formatDateTime(activity.dueAt) }}</template>
          <template v-if="submission"> · {{ activity.fieldCount }} campos · v{{ activity.templateVersion }}</template>
        </p>
      </div>

      <section v-if="submission" class="flex flex-col gap-7">
        <article
          v-for="(field, index) in submission.fields"
          :key="field.fieldId"
          class="grid gap-3 border-b pb-7 last:border-b-0"
        >
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-muted-foreground">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <span class="label-mono">{{ fieldTypeLabel(field.fieldType) }}</span>
          </div>
          <p class="font-medium">{{ field.label }}</p>

          <p
            v-if="field.kind === 'text'"
            class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
          >
            {{ field.value }}
          </p>
          <p v-else-if="field.kind === 'number'" class="font-serif text-3xl">
            {{ field.value }}
            <span v-if="typeof field.config.max === 'number'" class="text-base text-muted-foreground">
              / {{ field.config.max }}
            </span>
          </p>
          <p v-else-if="field.kind === 'boolean'" class="text-sm text-muted-foreground">
            {{ field.value ? 'Sim' : 'Não' }}
          </p>
          <p v-else-if="field.kind === 'datetime'" class="text-sm text-muted-foreground">
            {{ formatDateTime(field.value) }}
          </p>
          <div v-else-if="field.kind === 'json'" class="flex flex-wrap gap-2">
            <Badge v-for="value in jsonValues(field.value)" :key="value" variant="secondary">
              {{ value }}
            </Badge>
          </div>
          <div v-else class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <FileText class="size-4" />
            {{ field.value.mimeType }} · {{ field.value.sizeBytes }} bytes
          </div>
        </article>
      </section>

      <div
        v-else-if="activity.state === 'submission_invalid'"
        class="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
      >
        <AlertTriangle class="mt-0.5 size-4 shrink-0 text-destructive" />
        <p>
          A resposta está incompleta ou incompatível com a versão do template.
          A revisão permanece bloqueada.
        </p>
      </div>
      <p
        v-else
        class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
      >
        {{ activity.state === 'awaiting_response'
          ? 'A paciente ainda não respondeu esta atividade.'
          : 'Esta atividade foi encerrada sem resposta.' }}
      </p>
    </div>

    <div v-else-if="status === 'pending'" class="flex flex-col gap-3">
      <Skeleton class="h-8 w-64" />
      <Skeleton class="h-4 w-40" />
      <Skeleton class="mt-4 h-24 w-full" />
    </div>
    <div
      v-else-if="error"
      class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
    >
      Não foi possível carregar uma resposta íntegra. A revisão está bloqueada.
    </div>
  </div>
</template>
