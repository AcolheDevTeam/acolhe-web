<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  REVIEW_COMMENT_MAX,
  reviewRequestSchema,
  type ActivityReviewDetail,
  type CommentVisibility,
  type ReviewNote,
} from '~/schemas/activity'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Label } from '@/components/ui/label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Textarea } from '@/components/ui/textarea'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

// Revisar resposta (protótipo "Revisar"): respostas por campo em cards e, ao
// lado, a revisão: um comentário compartilhado (a paciente vê) ou interno (só a
// psicóloga), tags que só a psicóloga vê e "Marcar como revisada", que grava
// tudo de uma vez (ACO-104). Depois de revisada, comentário e tags continuam
// editáveis. O comentário da paciente ainda não existe na API e fica de fora.
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

// Rascunho da revisão. Recomeça do que está salvo quando a atividade troca ou
// quando chega uma versão nova e não há nada por salvar; com rascunho sujo, um
// refetch não apaga o que a psicóloga escreveu.
const EMPTY_REVIEW: ReviewNote = { comment: null, visibility: null, commentUpdatedAt: null, tags: [], updatedAt: null }
const savedReview = computed<ReviewNote>(() =>
  activity.value?.state === 'reviewed' ? activity.value.review ?? EMPTY_REVIEW : EMPTY_REVIEW)
const visibility = ref<CommentVisibility>('shared')
const comment = ref('')
const tags = ref<string[]>([])
const reviewError = ref('')
const versionConflict = ref(false)
function resetDraft() {
  const saved = savedReview.value
  visibility.value = saved.visibility ?? 'shared'
  comment.value = saved.comment ?? ''
  tags.value = [...saved.tags]
  reviewError.value = ''
  versionConflict.value = false
}

const visibilityOptions: { value: CommentVisibility, label: string }[] = [
  { value: 'shared', label: 'Compartilhado' },
  { value: 'private', label: 'Interno' },
]
const visibilityHelp = computed(() => visibility.value === 'shared'
  ? 'A paciente vê este comentário junto da resposta.'
  : 'Só você vê. Não aparece para a paciente nem na exportação dela.')
const commentPlaceholder = computed(() => visibility.value === 'shared'
  ? 'Escreva um retorno para a paciente'
  : 'Anotação para você')
const savedLine = computed(() => {
  const saved = savedReview.value
  if (!saved.comment || !saved.commentUpdatedAt) return ''
  const label = saved.visibility === 'shared' ? 'Compartilhado com a paciente' : 'Interno'
  return `${label} · salvo em ${formatDateTime(saved.commentUpdatedAt)}`
})
// Um comentário interno já salvo que vira compartilhado passa a aparecer para a
// paciente: avisa antes de salvar.
const becomingShared = computed(() =>
  savedReview.value.visibility === 'private'
  && visibility.value === 'shared'
  && !!comment.value.trim())
const dirty = computed(() => {
  const saved = savedReview.value
  const text = comment.value.trim()
  if (text !== (saved.comment ?? '')) return true
  if (text && visibility.value !== saved.visibility) return true
  return !sameTags(tags.value, saved.tags)
})

let draftFor: string | undefined
watch(() => [activity.value?.id, activity.value?.state, savedReview.value] as const, ([id]) => {
  if (id !== draftFor || !dirty.value) {
    draftFor = id
    resetDraft()
  }
}, { immediate: true })

async function saveReview() {
  const text = comment.value.trim()
  const parsed = reviewRequestSchema.safeParse({
    comment: text || undefined,
    visibility: text ? visibility.value : undefined,
    tags: tags.value,
    // Versão que esta tela leu; a API recusa (409) se outra aba salvou antes.
    expectedUpdatedAt: savedReview.value.updatedAt ?? null,
  })
  if (!parsed.success) {
    reviewError.value = parsed.error.issues[0]?.message ?? 'Confira o comentário e as tags.'
    return
  }
  reviewError.value = ''
  versionConflict.value = false
  const firstTime = activity.value?.state === 'submitted'
  reviewing.value = true
  try {
    await $fetch(`/api/activities/${activityId.value}/review`, {
      method: 'PUT',
      body: { ...parsed.data, tags: parsed.data.tags ?? [] },
    })
    // Gravado: o rascunho passa a ser a versão salva que vem no refetch.
    draftFor = undefined
    await Promise.all([
      refreshNuxtData(`activity-${activityId.value}`),
      refreshNuxtData('activities-all'),
    ])
    if (!firstTime) toast.success('Revisão atualizada.')
  } catch (error) {
    versionConflict.value = isReviewVersionConflict(error)
    reviewError.value = reviewErrorMessage(error)
  } finally {
    reviewing.value = false
  }
}

// Conflito de versão: busca a revisão atual sem apagar o rascunho (o watcher
// não reseta com rascunho sujo). O próximo "Salvar" usa a versão nova.
const reloading = ref(false)
async function reloadReview() {
  reloading.value = true
  try {
    await refreshNuxtData(`activity-${activityId.value}`)
    versionConflict.value = false
    reviewError.value = ''
    toast.info('Versão atual carregada. Confira o que mudou antes de salvar de novo.')
  } finally {
    reloading.value = false
  }
}

// Sair (ou ir para outra atividade) com revisão não salva pede confirmação.
const leaveConfirmOpen = ref(false)
let resolveLeave: ((leave: boolean) => void) | undefined
function decideLeave(leave: boolean) {
  leaveConfirmOpen.value = false
  resolveLeave?.(leave)
  resolveLeave = undefined
}
function confirmLeave(): Promise<boolean> {
  if (reviewing.value) return Promise.resolve(false)
  if (!dirty.value) return Promise.resolve(true)
  if (resolveLeave) return Promise.resolve(false)
  leaveConfirmOpen.value = true
  return new Promise<boolean>(resolve => { resolveLeave = resolve })
}
onBeforeRouteLeave(() => confirmLeave())
onBeforeRouteUpdate(() => confirmLeave())
function beforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value && !reviewing.value) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  decideLeave(false)
})
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

        <ActivityAnswerList v-if="submission" :fields="submission.fields" />

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
        <InlineNotice v-if="incomplete" tone="danger">
          A resposta está incompleta ou incompatível com a versão do template.
          A revisão permanece bloqueada.
        </InlineNotice>

        <template v-if="canReview || activity.state === 'reviewed'">
          <Card class="flex flex-col gap-3.5 p-5">
            <h2 class="text-base font-semibold">Sua revisão</h2>
            <SegmentedControl
              v-model="visibility"
              :options="visibilityOptions"
              label="Visibilidade do comentário"
              :disabled="reviewing"
            />
            <p class="text-[13px] leading-relaxed text-muted-foreground">{{ visibilityHelp }}</p>
            <InlineNotice v-if="becomingShared" tone="warning">
              Este comentário era interno. Ao salvar, a paciente passa a vê-lo.
            </InlineNotice>
            <div class="flex flex-col gap-1.5">
              <Label for="review-comment">Comentário</Label>
              <Textarea
                id="review-comment"
                v-model="comment"
                :placeholder="commentPlaceholder"
                :maxlength="REVIEW_COMMENT_MAX"
                :disabled="reviewing"
                class="min-h-[120px]"
                @update:model-value="reviewError = ''"
              />
              <p v-if="savedLine" class="font-mono text-[11px] text-muted-foreground">{{ savedLine }}</p>
            </div>
          </Card>

          <Card class="flex flex-col gap-3 p-5">
            <h2 class="flex items-baseline gap-2 text-base font-semibold">
              Tags <span class="label-mono font-normal">só você vê</span>
            </h2>
            <TagInput v-model="tags" label="Nova tag" list-label="Tags desta atividade" :disabled="reviewing" @update:model-value="reviewError = ''" />
          </Card>
        </template>

        <div aria-live="polite" class="flex flex-col gap-2.5">
          <p v-if="reviewError" class="text-sm text-destructive" role="alert">{{ reviewError }}</p>
          <Button v-if="versionConflict" variant="outline" class="w-full" :loading="reloading" @click="reloadReview">
            Recarregar a versão atual
          </Button>
          <Button
            v-if="canReview"
            size="xl"
            class="w-full"
            :loading="reviewing"
            @click="saveReview"
          >
            Marcar como revisada
          </Button>
          <template v-else-if="activity.state === 'reviewed'">
            <Button
              v-if="dirty"
              size="xl"
              class="w-full"
              :loading="reviewing"
              @click="saveReview"
            >
              Salvar alterações
            </Button>
            <span
              v-else
              class="animate-fade inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-positive-soft text-[15px] font-semibold text-positive"
            >
              <Check class="size-4" aria-hidden="true" />
              Revisada
            </span>
            <Button v-if="nextAfterReview" variant="outline" class="w-full" as-child>
              <NuxtLink :to="`/activities/${nextAfterReview.id}`">
                <span class="truncate">Ir para a próxima: {{ nextAfterReview.patientName ?? nextAfterReview.title }}</span>
              </NuxtLink>
            </Button>
          </template>
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
  <ConfirmDialog
    :open="leaveConfirmOpen"
    title="Sair sem salvar a revisão?"
    description="O comentário e as tags que você mudou ainda não foram salvos. Se sair agora, essas mudanças se perdem."
    confirm-label="Sair sem salvar"
    cancel-label="Continuar revisando"
    destructive
    @decision="decideLeave"
  />
</template>
