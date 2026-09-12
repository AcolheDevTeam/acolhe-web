<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type {
  FieldAnswer,
  PatientActivityDetail,
  PatientActivityField,
  SubmissionValue,
} from '~/schemas/patient-activity'

definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

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
    toast.success('Resposta enviada. Sua psicóloga vai ver na próxima revisão.')
    await navigateTo('/patient')
  }
  catch (err) {
    const { status: code, technical } = apiErrorInfo(err)
    // 400 da API nomeia a pergunta e o motivo, em português: mostra como veio.
    submitError.value = code === 400 && technical
      ? technical
      : apiErrorMessage(err, {
          409: 'Esta atividade não está mais disponível para resposta. Volte e recarregue a lista.',
          404: 'Esta atividade não existe mais.',
        })
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-32 pt-6 md:px-8">
    <div v-if="status === 'pending'" class="flex flex-col gap-4">
      <div class="h-6 w-40 animate-pulse rounded bg-muted" />
      <div class="h-40 animate-pulse rounded-xl bg-muted" />
    </div>

    <p v-else-if="error" class="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
      {{ apiErrorMessage(error, { 404: 'Esta atividade não existe ou não é sua.' }) }}
    </p>

    <template v-else-if="activity">
      <header class="flex items-start gap-3">
        <Button variant="ghost" size="icon" aria-label="Voltar" @click="navigateTo('/patient')">
          <ArrowLeft class="size-4" />
        </Button>
        <div class="min-w-0 flex-1">
          <p class="label-mono">Atividade</p>
          <h1 class="mt-1 text-xl font-medium">{{ activity.title }}</h1>
        </div>
        <Badge variant="secondary" class="shrink-0 font-normal">
          {{ activity.canRespond ? 'Em andamento' : 'Respondida' }}
        </Badge>
      </header>

      <!-- Já respondida, expirada ou cancelada: não há formulário a mostrar. -->
      <Card v-if="!activity.canRespond" class="mt-8">
        <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
          <Check class="size-6 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">
            {{ activity.submittedAt
              ? 'Você já respondeu esta atividade. Sua psicóloga vê a resposta na revisão dela.'
              : 'Esta atividade não está mais aberta para resposta.' }}
          </p>
          <Button variant="outline" @click="navigateTo('/patient')">Voltar para o início</Button>
        </CardContent>
      </Card>

      <p v-else-if="!total" class="mt-8 rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
        Esta atividade ainda não tem perguntas. Fale com sua psicóloga.
      </p>

      <template v-else-if="currentField">
        <div class="mt-6 flex flex-col gap-2">
          <div class="flex items-baseline justify-between text-sm">
            <span class="text-muted-foreground">Pergunta {{ step + 1 }} de {{ total }}</span>
            <span class="tabular-nums text-muted-foreground">{{ percent }}%</span>
          </div>
          <Progress :model-value="percent" />
        </div>

        <section class="mt-8 flex flex-col gap-4">
          <p class="label-mono">
            {{ String(step + 1).padStart(2, '0') }} · {{ fieldTypeLabel(currentField.fieldType) }}
          </p>
          <h2 class="text-2xl font-medium leading-snug">{{ currentField.label }}</h2>
          <p v-if="currentField.config.helpText" class="text-sm text-muted-foreground">
            {{ currentField.config.helpText }}
          </p>
          <p v-if="step === 0 && activity.instructions" class="rounded-xl bg-muted px-5 py-4 text-sm">
            {{ activity.instructions }}
          </p>

          <!-- ~/components é registrado com pathPrefix: false, então o nome não
               leva a pasta: components/patient/ActivityFieldInput.vue é
               <ActivityFieldInput>. -->
          <ActivityFieldInput
            :key="currentField.code"
            :field="currentField"
            :model-value="answerFor(currentField)"
            @update:model-value="(value: FieldAnswer) => setAnswer(currentField!, value)"
          />

          <p v-if="submitError" class="text-sm text-destructive">{{ submitError }}</p>
        </section>

        <!-- Rodapé fixo, como na tela 19: a ação principal fica sempre alcançável.
             z-30 fica acima da navegação inferior do layout da paciente (z-20):
             durante a resposta a barra de ação é a única coisa fixa embaixo, como
             no design, e "Sair" é o caminho de volta. -->
        <div class="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur">
          <div class="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-4 md:px-8">
            <Button variant="outline" :disabled="sending" @click="goBack">
              {{ step === 0 ? 'Sair' : 'Voltar' }}
            </Button>
            <Button :disabled="sending" @click="goForward">
              {{ isLast ? (sending ? 'Enviando…' : 'Enviar resposta') : 'Continuar' }}
              <ArrowRight v-if="!isLast" class="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </template>
    </template>
  </main>
</template>
