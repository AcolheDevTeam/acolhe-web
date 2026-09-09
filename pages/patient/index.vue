<script setup lang="ts">
import { ArrowRight, CalendarDays, Check, Clock3, HeartPulse, RefreshCw } from 'lucide-vue-next'
import type { User } from '~/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sessionExpired } from '~/utils/patient-portal'

definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

const { me, context, nextSession, activities, checkins, summary, pending, error } = usePatientPortal()
const mood = ref(0)
const note = ref('')
const checkinSubmitting = ref(false)
const checkinError = ref('')
const firstName = computed(() => (context.data.value?.fullName ?? me.value?.patient?.fullName ?? '').split(' ')[0])
const latestCheckin = computed(() => checkins.data.value?.[0])

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
    await $fetch('/api/patient/check-ins', { method: 'POST', body: { mood: mood.value, note: note.value || undefined } })
    mood.value = 0
    note.value = ''
    await Promise.all([checkins.refresh(), summary.refresh()])
  } catch {
    checkinError.value = 'Não foi possível salvar agora. Tente novamente.'
  } finally {
    checkinSubmitting.value = false
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
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
          <CardContent class="p-6 pt-3">
            <div class="flex items-center gap-2 text-sm text-primary-foreground/75">
              <Clock3 class="size-4" />
              <span>{{ nextSession.data.value ? 'Acompanhe seu próximo encontro' : 'Sem agenda por enquanto' }}</span>
            </div>
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
            <div v-for="activity in activities.data.value" :key="activity.id" class="flex items-center justify-between gap-4 p-5">
              <div class="min-w-0">
                <p class="truncate font-medium">{{ activity.title }}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ activity.dueAt ? `Até ${formatDate(activity.dueAt)}` : 'Para fazer entre as sessões' }}
                </p>
              </div>
              <ArrowRight class="size-4 shrink-0 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <p v-else class="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
          Nenhuma atividade pendente. Este espaço fica aqui quando houver uma nova proposta.
        </p>
      </section>

      <section id="check-in" class="grid gap-4 md:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader class="p-6 pb-3">
            <div class="flex items-center gap-2"><HeartPulse class="size-4" /><p class="label-mono">Check-in de hoje</p></div>
            <CardTitle class="font-serif text-2xl font-normal">Como você está?</CardTitle>
            <CardDescription>Um registro rápido para você observar seu próprio ritmo.</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-4 p-6 pt-3">
            <div class="flex gap-2" role="radiogroup" aria-label="Humor de hoje">
              <Button v-for="value in 5" :key="value" type="button" :variant="mood === value ? 'default' : 'outline'" class="size-10 rounded-full p-0" :aria-checked="mood === value" role="radio" @click="mood = value">
                {{ value }}
              </Button>
            </div>
            <textarea v-model="note" class="min-h-20 resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" placeholder="Quer deixar uma nota? (opcional)" aria-label="Nota do check-in" />
            <p v-if="checkinError" class="text-sm text-destructive">{{ checkinError }}</p>
            <Button class="self-start" :disabled="!mood || checkinSubmitting" @click="submitCheckin"><Check class="size-4" />{{ checkinSubmitting ? 'Salvando…' : 'Salvar check-in' }}</Button>
          </CardContent>
        </Card>
        <Card class="bg-muted/40 shadow-none">
          <CardHeader class="p-6 pb-3"><p class="label-mono">Último registro</p></CardHeader>
          <CardContent class="p-6 pt-1">
            <p v-if="latestCheckin" class="font-serif text-4xl">{{ latestCheckin.mood }}<span class="text-lg text-muted-foreground"> / 5</span></p>
            <p v-if="latestCheckin?.note" class="mt-3 text-sm leading-relaxed text-muted-foreground">“{{ latestCheckin.note }}”</p>
            <p v-else class="text-sm leading-relaxed text-muted-foreground">Seu último check-in aparecerá aqui.</p>
          </CardContent>
        </Card>
      </section>
    </template>
  </div>
</template>
