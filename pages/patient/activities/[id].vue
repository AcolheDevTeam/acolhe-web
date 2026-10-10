<script setup lang="ts">
import { Check, ChevronLeft } from 'lucide-vue-next'
import { onBeforeRouteLeave } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type {
  FieldAnswer,
  PatientActivityDetail,
  PatientActivityField,
  SubmissionValue,
} from '~/schemas/patient-activity'

// Tela cheia, sem a tabbar (protótipo "Respondendo atividade"): cabeçalho com
// progresso, uma pergunta por vez e o rodapé Voltar/Continuar fixo. O rascunho
// não é guardado: as respostas são clínicas e não ficam no navegador.
definePageMeta({ layout: false, middleware: ['auth', 'patient-only'] })

const route = useRoute()
const assignmentId = computed(() => route.params.id as string)

const { data: activity, status, error } = await useFetch<PatientActivityDetail>(
  () => `/api/patient/activities/${assignmentId.value}`,
  { key: () => `patient-activity-${assignmentId.value}` },
)

// submissionId estável por tentativa: se a rede cair no meio do envio e a
// paciente tocar de novo, a API reconhece a mesma submissão em vez de recusar.
const submissionId = ref(crypto.randomUUID())
const answers = ref<Record<string, FieldAnswer>>({})
const step = ref(0)
const sending = ref(false)
const submitError = ref('')
const sent = ref(false)
const direction = ref<'fwd' | 'back'>('fwd')

const fields = computed(() => activity.value?.fields ?? [])
const total = computed(() => fields.value.length)
const currentField = computed<PatientActivityField | undefined>(() => fields.value[step.value])
const isLast = computed(() => step.value === total.value - 1)
const percent = computed(() => (total.value ? Math.round(((step.value + 1) / total.value) * 100) : 0))

function answerFor(field: PatientActivityField): FieldAnswer {
  return answers.value[field.code] ?? null
}

function setAnswer(field: PatientActivityField, value: FieldAnswer) {
  answers.value = { ...answers.value, [field.code]: value }
  submitError.value = ''
}

// A API recusa campo em branco, mesmo opcional: o banco exige um valor por campo.
// Bloquear aqui evita uma ida ao servidor só para receber o erro de volta.
function isAnswered(field: PatientActivityField): boolean {
  const value = answers.value[field.code]
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return true
}

function toSubmissionValue(field: PatientActivityField): SubmissionValue {
  const value = answers.value[field.code]
  const base = { fieldCode: field.code, kind: field.fieldType } as const
  switch (field.fieldType) {
    case 'short_text':
    case 'long_text':
      return { ...base, text: String(value).trim() }
    case 'scale':
      return { ...base, number: Number(value) }
    case 'boolean':
      return { ...base, boolean: Boolean(value) }
    case 'date':
      return { ...base, date: String(value) }
    case 'datetime':
      return { ...base, datetime: String(value) }
    case 'single_choice':
      return { ...base, choice: String(value) }
    case 'multiple_choice':
      return { ...base, choices: Array.isArray(value) ? value : [] }
  }
}

function goBack() {
  submitError.value = ''
  if (step.value === 0) return navigateTo('/patient')
  direction.value = 'back'
  step.value--
}

async function goForward() {
  const field = currentField.value
  if (!field) return
  if (!isAnswered(field)) {
    submitError.value = field.config.required === false
      ? 'Responda esta pergunta para continuar. A atividade é enviada de uma vez só.'
      : 'Responda esta pergunta para continuar.'
    return
  }
  if (!isLast.value) {
    direction.value = 'fwd'
    step.value++
    return
  }
  await send()
}

async function send() {
  if (!activity.value) return
  sending.value = true
  submitError.value = ''
  try {
    await $fetch(`/api/patient/activities/${assignmentId.value}/responses`, {
      method: 'POST',
      body: {
        submissionId: submissionId.value,
        templateVersion: activity.value.templateVersion,
        values: fields.value.map(toSubmissionValue),
      },
    })
    sent.value = true
  }
  catch (err) {
    const { status: code, technical } = apiErrorInfo(err)
    // 400 da API nomeia a pergunta e o motivo, em português: mostra como veio.
    // Mensagens técnicas ("corpo inválido", "id inválido") e o JSON do Zod do
    // BFF não servem à paciente: caem no texto genérico.
    const readable = code === 400 && technical
      && !/^(corpo|id|dados)\b.*inválid/i.test(technical)
      && !/^[[{]/.test(technical.trim())
    submitError.value = readable
      ? technical
      : apiErrorMessage(err, {
          400: 'Confira suas respostas e tente de novo.',
          409: 'Esta atividade não está mais disponível para resposta. Volte e recarregue a lista.',
          404: 'Esta atividade não existe mais.',
        })
  }
  finally {
    sending.value = false
  }
}
// Sair com respostas não enviadas pede confirmação: elas não ficam guardadas.
// Durante o envio a saída fica bloqueada para não perder a confirmação.
const hasAnswers = computed(() => !sent.value && fields.value.some(isAnswered))
const leaveConfirmOpen = ref(false)
let resolveLeave: ((leave: boolean) => void) | undefined
function decideLeave(leave: boolean) {
  leaveConfirmOpen.value = false
  resolveLeave?.(leave)
  resolveLeave = undefined
}
function confirmLeave(): Promise<boolean> {
  if (sending.value) return Promise.resolve(false)
  if (!hasAnswers.value) return Promise.resolve(true)
  if (resolveLeave) return Promise.resolve(false)
  leaveConfirmOpen.value = true
  return new Promise<boolean>(resolve => { resolveLeave = resolve })
}
onBeforeRouteLeave(() => confirmLeave())
function beforeUnload(event: BeforeUnloadEvent) {
  if (!hasAnswers.value && !sending.value) return
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
  <div class="flex min-h-dvh flex-col bg-background text-foreground">
    <header class="sticky top-0 z-20 border-b bg-background">
      <div class="mx-auto flex w-full max-w-2xl flex-col gap-3.5 px-4 pb-4 pt-5 md:px-8">
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon-lg" class="-ml-1 shrink-0 text-foreground" aria-label="Voltar para o início" :disabled="sending" @click="navigateTo('/patient')">
            <ChevronLeft class="!size-5" />
          </Button>
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="label-mono">Atividade</span>
            <h1 class="truncate text-base font-semibold">{{ activity?.title ?? 'Carregando…' }}</h1>
          </div>
        </div>
        <div v-if="activity?.canRespond && total && !sent" class="flex flex-col gap-2">
          <div class="flex justify-between text-[13px] text-secondary-foreground">
            <span aria-live="polite">Pergunta {{ step + 1 }} de {{ total }}</span>
            <span class="font-mono text-xs text-muted-foreground">{{ percent }}%</span>
          </div>
          <Progress :model-value="percent" class="bg-accent" aria-label="Progresso" />
        </div>
      </div>
    </header>

    <main :class="['mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-x-hidden px-5 py-6 md:px-8', activity?.canRespond && total && !sent ? 'pb-36' : '']">
      <div v-if="status === 'pending'" class="flex flex-col gap-4">
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-8 w-3/4" />
        <Skeleton class="h-40 rounded-xl" />
      </div>

      <EmptyState v-else-if="error" compact>
        {{ apiErrorMessage(error, { 404: 'Esta atividade não existe ou não é sua.' }) }}
        <template #action>
          <Button variant="outline" @click="navigateTo('/patient')">Voltar para o início</Button>
        </template>
      </EmptyState>

      <template v-else-if="activity">
        <!-- Enviada agora: confirmação no lugar, como no protótipo. -->
        <div v-if="sent" class="animate-fade flex flex-col items-center gap-4 pt-16 text-center" aria-live="polite">
          <span aria-hidden="true" class="flex size-[72px] items-center justify-center rounded-full bg-accent text-primary">
            <Check class="size-8" :stroke-width="2.2" />
          </span>
          <h2 class="text-[22px] font-semibold tracking-[-0.02em]">Resposta enviada</h2>
          <p class="max-w-[300px] text-[15px] leading-normal text-secondary-foreground">Sua psicóloga vê a resposta na revisão dela.</p>
          <Button size="xl" class="mt-4 w-full max-w-sm" @click="navigateTo('/patient')">Voltar para o início</Button>
        </div>

        <!-- Já respondida, expirada ou cancelada: não há formulário a mostrar. -->
        <div v-else-if="!activity.canRespond" class="flex flex-col items-center gap-4 pt-16 text-center">
          <span aria-hidden="true" class="flex size-[72px] items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Check class="size-8" :stroke-width="2.2" />
          </span>
          <p class="max-w-[320px] text-[15px] leading-normal text-secondary-foreground">
            {{ activity.submittedAt
              ? 'Você já respondeu esta atividade. Sua psicóloga vê a resposta na revisão dela.'
              : 'Esta atividade não está mais aberta para resposta.' }}
          </p>
          <Button variant="outline" size="xl" class="mt-2 w-full max-w-sm" @click="navigateTo('/patient')">Voltar para o início</Button>
        </div>

        <EmptyState v-else-if="!total" compact>
          Esta atividade ainda não tem perguntas. Fale com sua psicóloga.
        </EmptyState>

        <template v-else-if="currentField">
          <section :key="currentField.code" :class="['flex flex-col gap-3.5', direction === 'fwd' ? 'question-fwd' : 'question-back']">
            <p class="label-mono">
              {{ String(step + 1).padStart(2, '0') }} · {{ fieldTypeLabel(currentField.fieldType) }}
            </p>
            <h2 class="text-[22px] font-semibold leading-tight tracking-[-0.02em]">{{ currentField.label }}</h2>
            <p v-if="currentField.config.helpText" class="text-sm text-secondary-foreground">
              {{ currentField.config.helpText }}
            </p>
            <p v-if="step === 0 && activity.instructions" class="rounded-xl bg-secondary px-4 py-3.5 text-sm leading-relaxed text-secondary-foreground">
              {{ activity.instructions }}
            </p>

            <!-- ~/components é registrado com pathPrefix: false, então o nome não
                 leva a pasta: components/patient/ActivityFieldInput.vue é
                 <ActivityFieldInput>. -->
            <ActivityFieldInput
              :field="currentField"
              :model-value="answerFor(currentField)"
              @update:model-value="(value: FieldAnswer) => setAnswer(currentField!, value)"
            />

            <p v-if="submitError" class="text-sm text-destructive" role="alert">{{ submitError }}</p>
          </section>
        </template>
      </template>
    </main>

    <!-- Rodapé fixo: a ação principal fica sempre ao alcance do polegar. -->
    <footer v-if="activity?.canRespond && total && !sent && currentField" class="fixed inset-x-0 bottom-0 z-30 border-t bg-card">
      <div class="mx-auto flex w-full max-w-2xl gap-2.5 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 md:px-8">
        <Button v-if="step > 0" variant="outline" size="xl" class="w-24 shrink-0" :disabled="sending" @click="goBack">Voltar</Button>
        <Button size="xl" class="flex-1" :loading="sending" @click="goForward">
          {{ isLast ? (sending ? 'Enviando…' : 'Enviar resposta') : 'Continuar' }}
        </Button>
      </div>
    </footer>
    <ConfirmDialog
      :open="leaveConfirmOpen"
      title="Sair sem enviar?"
      description="Suas respostas ainda não foram enviadas e não ficam salvas. Se sair agora, elas serão perdidas."
      confirm-label="Sair sem enviar"
      cancel-label="Continuar respondendo"
      destructive
      @decision="decideLeave"
    />
  </div>
</template>

<style scoped>
.question-fwd { animation: question-fwd .45s cubic-bezier(.2, .7, .2, 1) both; }
.question-back { animation: question-back .45s cubic-bezier(.2, .7, .2, 1) both; }
@keyframes question-fwd { from { opacity: 0; transform: translateX(32px); } }
@keyframes question-back { from { opacity: 0; transform: translateX(-32px); } }
</style>
