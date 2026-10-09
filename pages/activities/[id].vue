<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, FileText } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ActivityReviewDetail } from '~/schemas/activity'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { InlineNotice } from '@/components/ui/inline-notice'

type ReviewField = Extract<ActivityReviewDetail, { state: 'submitted' }>['submission']['fields'][number]

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

// Revisar resposta (protótipo "Revisar"): respostas por campo em cards e a
// ação de marcar como revisada ao lado. Comentário da paciente, comentários
// da psicóloga e tags dependem de API que ainda não existe e ficam de fora.
const route = useRoute()
const activityId = computed(() => route.params.id as string)
const { data: activity, status, error } = useActivity(activityId)

// A fila "Aguardando revisão" (mesma lista da tela de atividades) dá a
// posição e a navegação anterior/próxima.
const { data: activities } = useActivities()
const queue = computed(() => (activities.value ?? []).filter(a => a.status === 'submitted'))
const queueIndex = computed(() => queue.value.findIndex(a => a.id === activityId.value))
const prevItem = computed(() => (queueIndex.value > 0 ? queue.value[queueIndex.value - 1] : null))
const nextItem = computed(() => (queueIndex.value >= 0 ? queue.value[queueIndex.value + 1] ?? null : null))
// Depois de revisar, a atual sai da fila: a próxima é a primeira que sobrou.
const nextAfterReview = computed(() =>
  nextItem.value ?? queue.value.find(a => a.id !== activityId.value) ?? null)

const reviewing = ref(false)
const submission = computed(() =>
  activity.value?.state === 'submitted' || activity.value?.state === 'reviewed'
    ? activity.value.submission
    : null,
)
// Resposta com menos campos do que a versão do template: não é íntegra. Só
// importa enquanto a resposta aguarda revisão; depois disso o estado manda.
const incomplete = computed(() =>
  activity.value?.state === 'submitted'
  && !!submission.value && submission.value.fields.length !== activity.value?.fieldCount,
)
const canReview = computed(() =>
  status.value === 'success'
  && activity.value?.state === 'submitted'
  && !incomplete.value,
)

function stateMeta(detail: ActivityReviewDetail): { label: string, variant: 'warning' | 'positive' | 'danger' | 'neutral' } {
  switch (detail.state) {
    case 'submitted':
      return { label: 'Aguardando revisão', variant: 'warning' }
    case 'reviewed':
      return { label: 'Revisada', variant: 'positive' }
    case 'submission_invalid':
      return { label: 'Resposta inválida', variant: 'danger' }
    case 'closed_without_submission':
      return { label: 'Encerrada sem resposta', variant: 'neutral' }
    default:
      return activityQueueBadge(detail)
  }
}

// Trecho do breadcrumb: a aba da fila onde a atividade aparece.
const crumb = computed(() => {
  if (!activity.value) return null
  const tab = activityQueueTab(activity.value)
  if (tab === 'review') return { label: 'Aguardando revisão', tab }
  return { label: ACTIVITY_QUEUE_TABS.find(t => t.value === tab)!.label, tab }
})
const crumbs = computed(() => [
  { label: 'Atividades', to: '/activities' },
  ...(crumb.value
    ? [{ label: crumb.value.label, to: crumb.value.tab === 'review' ? '/activities' : `/activities?tab=${crumb.value.tab}` }]
    : []),
  { label: activity.value?.title ?? 'Atividade' },
])

const metaLine = computed(() => {
  const detail = activity.value
  if (!detail) return ''
  const parts = [`v${detail.templateVersion}`]
  if (submission.value) parts.push(`respondida em ${formatDateTime(submission.value.submittedAt)}`)
  else if (detail.dueAt) parts.push(`prazo ${formatDateTime(detail.dueAt)}`)
  return parts.join(' · ')
})

function fieldTypeLabel(type: string) {
  const labels: Record<string, string> = {
    long_text: 'Texto longo',
    short_text: 'Texto curto',
    text: 'Texto',
    scale: 'Escala',
    number: 'Número',
    boolean: 'Sim ou não',
    datetime: 'Data e hora',
    date: 'Data',
    multiple_choice: 'Múltipla escolha',
    single_choice: 'Escolha única',
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

// Escolhas: mostra todas as opções do template e destaca as marcadas, como no
// protótipo. Sem opções na config, só as marcadas aparecem.
function choiceOptions(config: Record<string, unknown>, value: unknown) {
  const marked = jsonValues(value)
  const options = Array.isArray(config.options) ? config.options.map(String) : []
  const list = options.length ? [...options, ...marked.filter(m => !options.includes(m))] : marked
  return list.map(label => ({ label, on: marked.includes(label) }))
}

// Escolha única chega como texto; com opções na config, vira pílulas também.
function choicePills(field: ReviewField) {
  if (field.kind === 'json') return choiceOptions(field.config, field.value)
  if (field.kind === 'text' && field.fieldType === 'single_choice' && Array.isArray(field.config.options)) {
    return choiceOptions(field.config, field.value)
  }
  return null
}

// Escala vira a fileira de valores com o escolhido destacado.
function scaleSteps(config: Record<string, unknown>) {
  const min = typeof config.min === 'number' ? config.min : 1
  const max = typeof config.max === 'number' ? config.max : 10
  if (max < min || max - min > 20) return []
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}

async function markReviewed() {
  reviewing.value = true
  try {
    await $fetch(`/api/activities/${activityId.value}/review`, {
      method: 'PUT',
    })
    await Promise.all([
      refreshNuxtData(`activity-${activityId.value}`),
      refreshNuxtData('activities-all'),
    ])
  } catch (error) {
    toast.error(apiErrorMessage(error, {
      404: 'Esta atividade ainda não tem uma resposta completa para revisar.',
      409: 'Esta atividade já foi revisada.',
      default: 'Não foi possível concluir a revisão agora.',
    }))
  } finally {
    reviewing.value = false
  }
}
</script>

<template>
  <PageHeader>
    <template #title>
      <Breadcrumb :items="crumbs" />
    </template>
    <template v-if="queueIndex >= 0" #actions>
      <!-- No celular só "1 de 3", para os botões caberem na linha. -->
      <span class="font-mono text-xs text-muted-foreground">
        {{ queueIndex + 1 }} de {{ queue.length }}<span class="hidden sm:inline"> aguardando revisão</span>
      </span>
      <div class="flex items-center gap-2">
        <Button v-if="prevItem" variant="outline" as-child>
          <NuxtLink :to="`/activities/${prevItem.id}`" aria-label="Resposta anterior">
            <ChevronLeft />
            Anterior
          </NuxtLink>
        </Button>
        <Button v-else variant="outline" disabled aria-label="Resposta anterior">
          <ChevronLeft />
          Anterior
        </Button>
        <Button v-if="nextItem" variant="outline" as-child>
          <NuxtLink :to="`/activities/${nextItem.id}`" aria-label="Próxima resposta">
            Próxima
            <ChevronRight />
          </NuxtLink>
        </Button>
        <Button v-else variant="outline" disabled aria-label="Próxima resposta">
          Próxima
          <ChevronRight />
        </Button>
      </div>
    </template>
  </PageHeader>

  <div class="px-4 pb-14 pt-6 md:px-8 lg:px-12">
    <div
      v-if="activity"
      :key="activity.id"
      class="animate-rise mx-auto flex max-w-[1240px] flex-wrap items-start gap-6"
    >
      <div class="flex min-w-0 flex-[2_1_480px] flex-col gap-5">
        <header class="flex flex-wrap items-center gap-4">
          <Avatar class="size-[52px] text-[17px]" aria-hidden="true">
            <AvatarFallback>{{ initials(activity.patientName) }}</AvatarFallback>
          </Avatar>
          <div class="min-w-0 flex-[1_1_260px]">
            <h1 class="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em]">{{ activity.title }}</h1>
            <p class="mt-1 text-sm text-secondary-foreground">
              <NuxtLink
                :to="`/patients/${activity.patientId}/activities`"
                class="text-secondary-foreground underline-offset-[3px] hover:text-foreground hover:underline"
              >
                {{ activity.patientName }}
              </NuxtLink>
              · {{ metaLine }}
            </p>
          </div>
          <Badge :variant="stateMeta(activity).variant" class="h-7 px-3 text-[13px]">
            {{ stateMeta(activity).label }}
          </Badge>
        </header>

        <ol v-if="submission" class="flex flex-col gap-3.5">
          <li v-for="(field, index) in submission.fields" :key="field.fieldId">
            <Card
              class="animate-fade flex flex-col gap-2.5 p-5"
              :style="{ animationDelay: `${index * 60}ms` }"
            >
              <span class="label-mono tracking-[0.1em]">
                {{ String(index + 1).padStart(2, '0') }} · {{ fieldTypeLabel(field.fieldType) }}
              </span>
              <h2 class="text-base font-semibold">{{ field.label }}</h2>

              <ul
                v-if="choicePills(field)"
                class="flex flex-wrap gap-2"
              >
                <li
                  v-for="option in choicePills(field)"
                  :key="option.label"
                  class="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px]"
                  :class="option.on ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'"
                >
                  <Check v-if="option.on" class="size-3.5" aria-hidden="true" />
                  {{ option.label }}
                  <span class="sr-only">{{ option.on ? '(marcada)' : '(não marcada)' }}</span>
                </li>
              </ul>
              <p v-else-if="field.kind === 'text'" class="whitespace-pre-line text-[15px] leading-relaxed">
                {{ field.value }}
              </p>
              <template v-else-if="field.kind === 'number'">
                <div
                  v-if="field.fieldType === 'scale' && scaleSteps(field.config).length"
                  role="img"
                  :aria-label="`Valor ${field.value}${typeof field.config.max === 'number' ? ` de ${field.config.max}` : ''}`"
                  class="flex gap-1"
                >
                  <span
                    v-for="n in scaleSteps(field.config)"
                    :key="n"
                    class="flex h-10 min-w-0 flex-1 items-center justify-center rounded-[9px] text-sm"
                    :class="n === field.value ? 'bg-primary font-semibold text-primary-foreground' : 'bg-secondary text-muted-foreground'"
                  >
                    {{ n }}
                  </span>
                </div>
                <p v-else class="text-[26px] font-semibold tracking-[-0.02em]">
                  {{ field.value }}
                  <span v-if="typeof field.config.max === 'number'" class="text-base font-normal text-muted-foreground">
                    / {{ field.config.max }}
                  </span>
                </p>
              </template>
              <p v-else-if="field.kind === 'boolean'" class="text-[15px]">
                {{ field.value ? 'Sim' : 'Não' }}
              </p>
              <p v-else-if="field.kind === 'datetime'" class="text-[15px]">
                {{ formatDateTime(field.value) }}
              </p>
              <div v-else-if="field.kind === 'attachment'" class="flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <FileText class="size-4" />
                {{ field.value.mimeType }} · {{ field.value.sizeBytes }} bytes
              </div>
            </Card>
          </li>
        </ol>

        <InlineNotice v-else-if="activity.state === 'submission_invalid'" tone="danger">
          A resposta está incompleta ou incompatível com a versão do template.
          A revisão permanece bloqueada.
        </InlineNotice>
        <EmptyState v-else compact>
          {{ activity.state === 'awaiting_response'
            ? 'A paciente ainda não respondeu esta atividade.'
            : 'Esta atividade foi encerrada sem resposta.' }}
        </EmptyState>
      </div>

      <aside
        v-if="submission"
        aria-label="Sua revisão"
        class="flex min-w-0 flex-[1_1_320px] flex-col gap-4 lg:sticky lg:top-6"
      >
        <div aria-live="polite">
          <InlineNotice v-if="incomplete" tone="danger">
            A resposta está incompleta ou incompatível com a versão do template.
            A revisão permanece bloqueada.
          </InlineNotice>
          <Button
            v-else-if="canReview"
            size="xl"
            class="w-full"
            :loading="reviewing"
            @click="markReviewed"
          >
            Marcar como revisada
          </Button>
          <div v-else-if="activity.state === 'reviewed'" class="animate-fade flex flex-col gap-2.5">
            <span
              class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-positive-soft text-[15px] font-semibold text-positive"
            >
              <Check class="size-4" aria-hidden="true" />
              Revisada
            </span>
            <Button v-if="nextAfterReview" variant="outline" class="w-full" as-child>
              <NuxtLink :to="`/activities/${nextAfterReview.id}`">
                <span class="truncate">Ir para a próxima: {{ nextAfterReview.patientName ?? nextAfterReview.title }}</span>
              </NuxtLink>
            </Button>
          </div>
        </div>
      </aside>
    </div>

    <div v-else-if="status === 'pending'" class="mx-auto flex max-w-[1240px] flex-col gap-3">
      <Skeleton class="h-8 w-64" />
      <Skeleton class="h-4 w-40" />
      <Skeleton class="mt-4 h-24 w-full" />
    </div>
    <InlineNotice v-else-if="error" tone="danger" class="mx-auto max-w-[1240px]">
      Não foi possível carregar uma resposta íntegra. A revisão está bloqueada.
    </InlineNotice>
  </div>
</template>
