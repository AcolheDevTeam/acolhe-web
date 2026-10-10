<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { useNow } from '@vueuse/core'
import type { PatientCheckin } from '~/types'
import { patientCheckinInputSchema } from '~/schemas/patient'
import { Button } from '@/components/ui/button'
import { ChoiceChips } from '@/components/ui/choice-chips'
import { Label } from '@/components/ui/label'
import { RatingScale } from '@/components/ui/rating-scale'
import { Textarea } from '@/components/ui/textarea'
import { TimeStepper } from '@/components/ui/time-stepper'

// Check-in do dia: registra ou edita o de hoje (um por dia, até o fim do dia
// no horário de Brasília). Emite `saved` para a página atualizar os dados.
// `quick` é o cartão do Início: humor e, depois dele, sentimentos e nota.
// `full` é a página Check-in: humor, sono, sentimentos e nota (ACO-103).
// Sono e sentimentos são opcionais. A API substitui o registro inteiro, então
// a edição pelo Início reenvia o sono que já estava gravado.
const props = withDefaults(defineProps<{ checkins: PatientCheckin[], variant?: 'quick' | 'full' }>(), { variant: 'quick' })
const emit = defineEmits<{ saved: [], conflict: [] }>()

const DEFAULT_BEDTIME = '23:00'
const DEFAULT_WAKE = '07:00'

const now = useNow({ interval: 60000 })
const mood = ref(0)
const note = ref('')
const feelings = ref<string[]>([])
const sleepOn = ref(false)
const bedtime = ref(DEFAULT_BEDTIME)
const wakeTime = ref(DEFAULT_WAKE)
const sleepQuality = ref<number | null>(null)
const submitting = ref(false)
const errorMessage = ref('')
const editing = ref(false)
const today = computed(() => props.checkins.find(item => item.day === checkinDay(now.value)))
const showForm = computed(() => !today.value || editing.value)
const noteId = useId()
const sleepTitleId = useId()

const sleepTotal = computed(() => sleepOn.value ? sleepDurationMinutes(bedtime.value, wakeTime.value) : null)
const todaySummary = computed(() => today.value ? checkinSummary(today.value) : '')

function reset() {
  mood.value = 0
  note.value = ''
  feelings.value = []
  clearSleep()
}

function clearSleep() {
  clearSleepTimes()
  sleepQuality.value = null
}

function clearSleepTimes() {
  sleepOn.value = false
  bedtime.value = DEFAULT_BEDTIME
  wakeTime.value = DEFAULT_WAKE
}

watch(() => today.value?.id, (id, previousId) => {
  editing.value = false
  if (previousId && !id) {
    reset()
    errorMessage.value = 'Um novo dia começou. O registro anterior está no histórico.'
  }
})

function edit() {
  const current = today.value
  if (!current) return
  mood.value = current.mood
  note.value = current.note ?? ''
  // Código que este front não conhece (opção nova na API) sai da edição em vez
  // de travar a validação.
  feelings.value = knownFeelings(current.feelings)
  sleepOn.value = Boolean(current.sleepBedtime && current.sleepWakeTime)
  bedtime.value = current.sleepBedtime ?? DEFAULT_BEDTIME
  wakeTime.value = current.sleepWakeTime ?? DEFAULT_WAKE
  sleepQuality.value = current.sleepQuality ?? null
  errorMessage.value = ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  reset()
}

async function submit() {
  if (!mood.value) return
  const parsed = patientCheckinInputSchema.safeParse({
    mood: mood.value,
    note: note.value,
    feelings: feelings.value,
    sleepBedtime: sleepOn.value ? bedtime.value : null,
    sleepWakeTime: sleepOn.value ? wakeTime.value : null,
    sleepQuality: sleepQuality.value,
  })
  if (!parsed.success) {
    errorMessage.value = parsed.error.issues[0]?.message ?? 'Revise o check-in e tente de novo.'
    return
  }
  submitting.value = true
  errorMessage.value = ''
  try {
    const current = today.value
    await $fetch(current ? `/api/patient/check-ins/${current.id}` : '/api/patient/check-ins', {
      method: current ? 'PUT' : 'POST', body: parsed.data,
    })
    editing.value = false
    reset()
    emit('saved')
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, {
      400: checkinRejectionMessage(error),
      403: 'Seu vínculo com a psicóloga não está ativo no momento, então não é possível registrar check-ins.',
      404: 'Este check-in não está mais disponível. Atualize a página.',
      409: editing.value
        ? 'O dia virou e este check-in não pode mais ser editado. Ele continua no seu histórico.'
        : 'Você já registrou o check-in de hoje. Atualize a página para editá-lo.',
      default: 'Não foi possível salvar o check-in agora. Tente novamente.',
    })
    emit('conflict')
  } finally {
    submitting.value = false
  }
}

const saveLabel = computed(() => submitting.value ? 'Salvando…' : editing.value ? 'Salvar alterações' : props.variant === 'quick' ? 'Registrar' : 'Registrar check-in')
</script>

<template>
  <!-- Início: um cartão só, como no protótipo. -->
  <section v-if="variant === 'quick'" class="flex flex-col gap-4 rounded-[18px] border bg-card p-5" aria-labelledby="t-checkin">
    <template v-if="showForm">
      <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="t-checkin" class="text-lg font-semibold tracking-[-0.01em]">Como você está agora?</h2>
        <span class="text-xs text-muted-foreground">visível para você e sua psicóloga</span>
      </div>
      <MoodPicker v-model="mood" label="Humor de agora" :disabled="submitting" />
      <div v-if="mood" class="animate-fade flex flex-col gap-3.5">
        <div class="flex flex-col gap-2.5">
          <p class="text-sm text-secondary-foreground">Quer marcar o que está sentindo? <span class="text-muted-foreground">(opcional)</span></p>
          <ChoiceChips v-model="feelings" :options="[...CHECKIN_FEELINGS]" label="O que você está sentindo" multiple size="lg" :disabled="submitting" />
        </div>
        <Label :for="noteId" class="text-sm font-normal text-secondary-foreground">Quer deixar uma nota? <span class="text-muted-foreground">(opcional)</span></Label>
        <Textarea :id="noteId" v-model="note" rows="2" :disabled="submitting" maxlength="1000" />
        <Button size="xl" class="w-full" :disabled="!mood" :loading="submitting" @click="submit">{{ saveLabel }}</Button>
        <Button v-if="editing" variant="ghost" :disabled="submitting" @click="cancelEdit">Cancelar edição</Button>
      </div>
    </template>
    <div v-else class="animate-fade flex items-center gap-[18px] py-1" aria-live="polite">
      <div aria-hidden="true" class="relative size-16 shrink-0">
        <span class="breathe absolute inset-0 m-auto size-16 rounded-full border-[1.5px] border-primary" />
        <span class="breathe absolute inset-0 m-auto size-10 rounded-full border-[1.5px] border-primary [animation-delay:.3s]" />
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <h2 id="t-checkin" class="text-base font-semibold">Check-in salvo.</h2>
        <p class="text-sm leading-snug text-secondary-foreground">{{ todaySummary }} Você pode editar até o fim do dia.</p>
        <button type="button" class="mt-1 self-start rounded text-[13px] text-primary underline underline-offset-[3px]" @click="edit">Editar check-in de hoje</button>
      </div>
    </div>
    <p v-if="errorMessage" class="text-sm text-destructive" role="alert">{{ errorMessage }}</p>
  </section>

  <!-- Página Check-in: humor, sono, sentimentos e nota em cartões. -->
  <div v-else class="flex flex-col gap-5">
    <template v-if="showForm">
      <section class="flex flex-col gap-3.5 rounded-2xl border bg-card p-[18px]" aria-labelledby="t-humor">
        <h2 id="t-humor" class="text-base font-semibold">Como você está?</h2>
        <MoodPicker v-model="mood" label="Humor" :disabled="submitting" />
      </section>

      <section class="flex flex-col gap-4 rounded-2xl border bg-card p-[18px]" :aria-labelledby="sleepTitleId">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 :id="sleepTitleId" class="text-base font-semibold">Sono da última noite <span class="text-sm font-normal text-muted-foreground">(opcional)</span></h2>
          <button v-if="sleepOn" type="button" class="rounded text-[13px] text-primary underline underline-offset-[3px]" :disabled="submitting" @click="clearSleepTimes">Remover horários</button>
        </div>
        <div v-if="sleepOn" class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-secondary-foreground">Dormi às</span>
            <TimeStepper v-model="bedtime" label="Horário em que dormiu" :disabled="submitting" />
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-secondary-foreground">Acordei às</span>
            <TimeStepper v-model="wakeTime" label="Horário em que acordou" :disabled="submitting" />
          </div>
          <p v-if="sleepTotal != null" class="text-sm text-secondary-foreground"><strong class="font-semibold text-foreground">{{ durationLabel(sleepTotal) }}</strong> de sono</p>
          <p v-else class="text-sm text-destructive" role="alert">O horário em que acordou precisa ser diferente do horário em que dormiu.</p>
        </div>
        <Button v-else variant="outline" class="w-full" :disabled="submitting" @click="sleepOn = true">Informar horários de sono</Button>
        <div class="flex flex-col gap-2">
          <div class="flex items-baseline justify-between gap-3">
            <span class="text-sm text-secondary-foreground" aria-hidden="true">Qualidade do sono</span>
            <button v-if="sleepQuality != null" type="button" class="rounded text-[13px] text-primary underline underline-offset-[3px]" :disabled="submitting" @click="sleepQuality = null">Limpar qualidade</button>
          </div>
          <RatingScale v-model="sleepQuality" label="Qualidade do sono, de 1 (ruim) a 5 (ótima)" min-label="Ruim" max-label="Ótima" :disabled="submitting" />
        </div>
      </section>

      <section class="flex flex-col gap-3 rounded-2xl border bg-card p-[18px]" aria-labelledby="t-sentimentos">
        <h2 id="t-sentimentos" class="text-base font-semibold">O que você está sentindo? <span class="text-sm font-normal text-muted-foreground">(opcional)</span></h2>
        <ChoiceChips v-model="feelings" :options="[...CHECKIN_FEELINGS]" label="O que você está sentindo" multiple size="lg" :disabled="submitting" />
        <Label :for="noteId" class="mt-1 text-sm font-normal text-secondary-foreground">Uma frase sobre o dia (opcional)</Label>
        <Textarea :id="noteId" v-model="note" rows="2" :disabled="submitting" maxlength="1000" />
        <p class="text-xs text-muted-foreground">Um registro por dia. Você pode editar até o fim do dia, no horário de Brasília.</p>
      </section>
      <div class="flex flex-col gap-2">
        <Button size="xl" class="w-full" :disabled="!mood" :loading="submitting" @click="submit">{{ saveLabel }}</Button>
        <Button v-if="editing" variant="ghost" :disabled="submitting" @click="cancelEdit">Cancelar edição</Button>
      </div>
    </template>
    <section v-else class="animate-fade flex flex-col gap-3 rounded-2xl border bg-card p-5" aria-live="polite">
      <div class="flex items-center gap-2.5 text-primary">
        <Check class="size-[22px]" :stroke-width="2.2" aria-hidden="true" />
        <h2 class="text-[17px] font-semibold text-foreground">Check-in salvo</h2>
      </div>
      <p class="text-sm leading-normal text-secondary-foreground">{{ todaySummary }} Você pode editar até o fim do dia.</p>
      <p v-if="today!.note" class="whitespace-pre-wrap break-words text-sm leading-normal">{{ today!.note }}</p>
      <Button variant="outline" size="xl" class="w-full" @click="edit">Editar check-in de hoje</Button>
    </section>
    <p v-if="errorMessage" class="text-sm text-destructive" role="alert">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.breathe {
  animation: breathe 11s cubic-bezier(.45, 0, .55, 1) infinite;
}
</style>
