<script setup lang="ts">
import { ArrowRight, CalendarDays, Check, Clock3, HeartPulse, RefreshCw } from 'lucide-vue-next'
import { useNow } from '@vueuse/core'
import type { PatientNextSession } from '~/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { sessionExpired } from '~/utils/patient-portal'

definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

const { me, context, nextSession, activities, checkins, summary, pending, error } = usePatientPortal()
const confirmationSubmitting = ref(false)
const confirmationError = ref('')
const now = useNow({ interval: 60000 })
const canConfirm = computed(() => nextSession.data.value?.status === 'scheduled'
  && new Date(nextSession.data.value.scheduledFor) > now.value)
watch(() => nextSession.data.value?.id, () => { confirmationError.value = '' })

async function confirmAppointment() {
  const appointment = nextSession.data.value
  if (!appointment || !canConfirm.value || confirmationSubmitting.value) return
  confirmationSubmitting.value = true
  confirmationError.value = ''
  try {
    const confirmed = await $fetch<PatientNextSession>(`/api/patient/appointments/${appointment.id}/confirm`, { method: 'POST' })
    nextSession.data.value = confirmed
    await nextSession.refresh()
  } catch (error) {
    confirmationError.value = apiErrorMessage(error, {
      403: 'Seu vínculo precisa estar ativo para confirmar a presença.',
      404: 'Este agendamento não está mais disponível para você.',
      409: 'Este agendamento foi encerrado ou o horário do atendimento já chegou.',
      default: 'Não foi possível confirmar sua presença agora. Tente novamente.',
    })
    await nextSession.refresh()
  } finally { confirmationSubmitting.value = false }
}

const mood = ref(0)
const note = ref('')
const checkinSubmitting = ref(false)
const checkinError = ref('')
const firstName = computed(() => (context.data.value?.fullName ?? me.value?.patient?.fullName ?? '').split(' ')[0])
const todayCheckin = computed(() => checkins.data.value?.find(item => item.day === checkinDay(now.value)))
const editingCheckin = ref(false)
watch(() => todayCheckin.value?.id, (id, previousId) => {
  editingCheckin.value = false
  if (previousId && !id) {
    mood.value = 0
    note.value = ''
    checkinError.value = 'Um novo dia começou. O registro anterior está no histórico.'
  }
})
function editTodayCheckin() {
  if (!todayCheckin.value) return
  mood.value = todayCheckin.value.mood
  note.value = todayCheckin.value.note ?? ''
  checkinError.value = ''
  editingCheckin.value = true
}

watch(error, (value) => {
  if (import.meta.client && sessionExpired(value as { statusCode?: number } | null)) {
    navigateTo('/login')
  }
})

async function submitCheckin() {
  if (!mood.value) return
  checkinSubmitting.value = true
  checkinError.value = ''
  try {
    const current = todayCheckin.value
    await $fetch(current ? `/api/patient/check-ins/${current.id}` : '/api/patient/check-ins', {
      method: current ? 'PUT' : 'POST', body: { mood: mood.value, note: note.value },
    })
    editingCheckin.value = false
    mood.value = 0
    note.value = ''
    await Promise.all([checkins.refresh(), summary.refresh()])
  } catch (error) {
    checkinError.value = apiErrorMessage(error, {
      400: 'Escolha uma nota de 1 a 5 e, se quiser, uma observação curta.',
      403: 'Seu vínculo com a psicóloga não está ativo no momento, então não é possível registrar check-ins.',
      404: 'Este check-in não está mais disponível. Atualize a página.',
      409: editingCheckin.value
        ? 'O dia virou e este check-in não pode mais ser editado. Ele continua no seu histórico.'
        : 'Você já registrou o check-in de hoje. Atualize a página para editá-lo.',
      default: 'Não foi possível salvar o check-in agora. Tente novamente.',
    })
    await checkins.refresh()
  } finally {
    checkinSubmitting.value = false
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: APP_TIMEZONE }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE }).format(new Date(value))
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <p class="label-mono">Paciente · espaço pessoal</p>
      <h1 class="display-serif text-4xl md:text-5xl">Olá{{ firstName ? `, ${firstName}` : '' }}.</h1>
      <p class="max-w-xl text-sm leading-relaxed text-muted-foreground">
        Um lugar simples para acompanhar seu processo entre as sessões.
      </p>
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-2" aria-live="polite" aria-label="Carregando seu espaço">
      <div v-for="item in 4" :key="item" class="h-36 animate-pulse rounded-xl border bg-muted/40" />
    </div>

    <Card v-else-if="error" class="border-destructive/40">
      <CardContent class="flex flex-col items-start gap-4 p-6">
        <p class="font-medium">Não foi possível carregar seu espaço.</p>
        <p class="text-sm text-muted-foreground">Sua sessão pode ter expirado ou o serviço está indisponível.</p>
        <div class="flex gap-2">
          <Button variant="outline" @click="() => refreshNuxtData()"><RefreshCw class="size-4" />Tentar novamente</Button>
          <Button variant="ghost" @click="navigateTo('/login')">Voltar ao login</Button>
        </div>
      </CardContent>
    </Card>

    <template v-else>
      <section class="grid gap-4 md:grid-cols-[1.35fr_1fr]">
        <Card class="overflow-hidden border-primary/15 bg-primary text-primary-foreground shadow-none">
          <CardHeader class="gap-4 p-6 pb-3">
            <div class="flex items-center justify-between">
              <p class="label-mono text-primary-foreground/65">Sua próxima sessão</p>
              <CalendarDays class="size-5 opacity-70" />
            </div>
            <CardTitle class="font-serif text-2xl font-normal">
              {{ nextSession.data.value ? formatDate(nextSession.data.value.scheduledFor) : 'Ainda não há uma sessão marcada' }}
            </CardTitle>
            <CardDescription class="text-primary-foreground/70">
              <template v-if="nextSession.data.value">
                {{ formatTime(nextSession.data.value.scheduledFor) }} · {{ nextSession.data.value.durationMinutes }} min ·
                {{ nextSession.data.value.modality === 'online' ? 'Online' : 'Presencial' }}
              </template>
              <template v-else>Quando houver uma nova sessão, ela aparecerá aqui.</template>
            </CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-4 p-6 pt-3">
            <div class="flex items-center gap-2 text-sm text-primary-foreground/75">
              <Clock3 class="size-4" />
              <span>{{ nextSession.data.value ? 'Acompanhe seu próximo encontro' : 'Sem agenda por enquanto' }}</span>
            </div>
            <p v-if="nextSession.data.value?.status === 'confirmed'" class="flex items-center gap-2 text-sm" role="status"><Check class="size-4" />Presença confirmada</p>
            <Button v-else-if="canConfirm" variant="secondary" class="w-full sm:w-auto sm:self-start" :disabled="confirmationSubmitting" @click="confirmAppointment">
              {{ confirmationSubmitting ? 'Confirmando…' : 'Confirmar presença' }}
            </Button>
            <p v-if="confirmationError" class="text-sm text-primary-foreground" role="alert">{{ confirmationError }}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-6 pb-3">
            <p class="label-mono">Resumo do processo</p>
            <CardTitle class="font-serif text-2xl font-normal">Seu ritmo</CardTitle>
          </CardHeader>
          <CardContent class="grid grid-cols-3 gap-3 p-6 pt-2">
            <div><p class="text-2xl font-medium tabular-nums">{{ summary.data.value.sessionCount }}</p><p class="text-xs text-muted-foreground">sessões</p></div>
            <div><p class="text-2xl font-medium tabular-nums">{{ summary.data.value.pendingActivityCount }}</p><p class="text-xs text-muted-foreground">pendentes</p></div>
            <div><p class="text-2xl font-medium tabular-nums">{{ summary.data.value.checkinCount }}</p><p class="text-xs text-muted-foreground">check-ins</p></div>
          </CardContent>
        </Card>
      </section>

      <section id="activities" class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <p class="label-mono">Atividades · {{ activities.data.value.length }} pendentes</p>
          <span class="text-xs text-muted-foreground">Só você vê esta lista</span>
        </div>
        <Card v-if="activities.data.value.length">
          <CardContent class="divide-y p-0">
            <NuxtLink
              v-for="activity in activities.data.value"
              :key="activity.id"
              :to="`/patient/activities/${activity.id}`"
              class="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted"
            >
              <div class="min-w-0">
                <p class="truncate font-medium">{{ activity.title }}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ activity.dueAt ? `Até ${formatDate(activity.dueAt)}` : 'Para fazer entre as sessões' }}
                </p>
              </div>
              <ArrowRight class="size-4 shrink-0 text-muted-foreground" />
            </NuxtLink>
          </CardContent>
        </Card>
        <EmptyState v-else compact>
          Nenhuma atividade pendente. Este espaço fica aqui quando houver uma nova proposta.
        </EmptyState>
      </section>

      <section id="check-in" class="grid gap-4 md:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader class="p-6 pb-3">
            <div class="flex items-center gap-2"><HeartPulse class="size-4" /><p class="label-mono">Check-in de hoje</p></div>
            <CardTitle class="font-serif text-2xl font-normal">Como você está?</CardTitle>
            <CardDescription>Um registro rápido para você observar seu próprio ritmo.</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-4 p-6 pt-3">
            <template v-if="todayCheckin && !editingCheckin">
              <p class="flex items-center gap-2 text-sm" role="status"><Check class="size-4" />Check-in de hoje registrado.</p>
              <p class="font-serif text-4xl">{{ todayCheckin.mood }}<span class="text-lg text-muted-foreground"> / 5</span></p>
              <p v-if="todayCheckin.note" class="whitespace-pre-wrap break-words text-sm">{{ todayCheckin.note }}</p>
              <p v-else class="text-sm text-muted-foreground">Sem observação.</p>
              <Button variant="outline" class="self-start" @click="editTodayCheckin">Editar check-in de hoje</Button>
            </template>
            <template v-else>
              <p class="text-xs text-muted-foreground">Um registro por dia. Você pode editar até o fim do dia, no horário de Brasília.</p>
              <div class="flex gap-2" role="radiogroup" aria-label="Humor de hoje">
                <Button v-for="value in 5" :key="value" type="button" :variant="mood === value ? 'default' : 'outline'" class="size-10 rounded-full p-0" :aria-checked="mood === value" role="radio" :disabled="checkinSubmitting" @click="mood = value">{{ value }}</Button>
              </div>
              <Textarea v-model="note" rows="3" :disabled="checkinSubmitting" maxlength="1000" placeholder="Quer deixar uma nota? (opcional)" aria-label="Nota do check-in" />
              <div class="flex flex-wrap gap-2">
                <Button :disabled="!mood || checkinSubmitting" @click="submitCheckin"><Check class="size-4" />{{ checkinSubmitting ? 'Salvando…' : editingCheckin ? 'Salvar alterações' : 'Salvar check-in' }}</Button>
                <Button v-if="editingCheckin" variant="ghost" :disabled="checkinSubmitting" @click="editingCheckin = false">Cancelar edição</Button>
              </div>
            </template>
            <p v-if="checkinError" class="text-sm text-destructive" role="alert">{{ checkinError }}</p>
          </CardContent>
        </Card>
        <Card class="bg-muted/40 shadow-none">
          <CardHeader class="p-6 pb-3"><p class="label-mono">Seu histórico de check-ins</p></CardHeader>
          <CardContent class="p-6 pt-1"><CheckinHistory :items="checkins.data.value ?? []" /></CardContent>
        </Card>
      </section>
    </template>
  </div>
</template>
