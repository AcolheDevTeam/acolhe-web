<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { Patient, User } from '~/types'
import type { AgendaRowState } from '~/utils/dashboard'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const { data: me } = await useFetch<User>('/api/me', { key: 'me' })
const { data: allAppointments } = useAppointments()
const { data: allActivities } = useActivities()
const { data: patients } = await useFetch<Patient[]>('/api/patients', {
  key: 'patients-list',
  default: () => [],
})

// "Agora", "Em 2 h" e "há 4 horas" dependem do relógio: atualiza a cada minuto.
const now = ref(new Date())
let tick: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  now.value = new Date()
  tick = setInterval(() => { now.value = new Date() }, 60_000)
})
onBeforeUnmount(() => clearInterval(tick))

const firstName = computed(() => me.value?.name?.split(' ')[0] ?? '')
const greeting = computed(() => {
  const h = zonedParts(now.value).hour
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
})
// Eyebrow do protótipo: "Quinta · 9 de outubro".
const today = computed(() => {
  const opts = { timeZone: APP_TIMEZONE } as const
  const weekday = new Intl.DateTimeFormat('pt-BR', { ...opts, weekday: 'long' }).format(now.value).replace('-feira', '')
  const date = new Intl.DateTimeFormat('pt-BR', { ...opts, day: 'numeric', month: 'long' }).format(now.value)
  return `${weekday} · ${date}`
})

const view = ref<'dia' | 'semana'>('dia')
const agenda = computed(() => agendaToday(allAppointments.value ?? [], now.value))
const week = computed(() => weekCounts(allAppointments.value ?? [], now.value))
const weekTotal = computed(() => week.value.reduce((sum, d) => sum + d.count, 0))
const weekMax = computed(() => Math.max(1, ...week.value.map(d => d.count)))
const weekAria = computed(() =>
  `Sessões por dia nesta semana: ${week.value.map(d => `${d.long} ${d.count}`).join(', ')}`)
// Altura útil das barras dentro dos 200px do gráfico (número e dia ocupam o resto).
const barHeight = (count: number) => (count ? Math.max(8, Math.round((count / weekMax.value) * 140)) : 4)

const reviews = computed(() => awaitingReview(allActivities.value ?? []))
const activePatients = computed(() => (patients.value ?? []).filter(p => p.status === 'active'))
const monthSessions = computed(() => sessionsThisMonth(allAppointments.value ?? [], now.value))
const answeredRate = computed(() => responseRate(allActivities.value ?? []))

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const summary = computed(() =>
  `${plural(agenda.value.length, 'sessão', 'sessões')} hoje e ${plural(reviews.value.length, 'resposta', 'respostas')} para revisar.`)

const dotClass: Record<AgendaRowState, string> = {
  done: 'bg-input-hover',
  miss: 'border-2 border-alert bg-card',
  now: 'now-dot bg-primary',
  next: 'border-2 border-input-hover bg-card',
  past: 'border-2 border-input-hover bg-card',
}
const labelClass: Record<AgendaRowState, string> = {
  done: 'text-muted-foreground',
  miss: 'text-warning',
  now: 'text-accent-foreground',
  next: 'text-muted-foreground',
  past: 'text-muted-foreground',
}
</script>

<template>
  <div class="flex animate-rise flex-wrap items-center justify-end gap-2.5 px-4 pt-6 md:px-8 lg:px-12">
    <NewPatientDialog>
      <Button variant="outline">
        <Plus />
        Novo paciente
      </Button>
    </NewPatientDialog>
    <NewSessionDialog>
      <Button>
        <Plus />
        Agendar sessão
      </Button>
    </NewSessionDialog>
  </div>

  <PageHeader display :eyebrow="today" :title="`${greeting}${firstName ? `, ${firstName}` : ''}.`" :description="summary" />

  <div class="flex flex-col gap-8 px-4 pb-14 pt-8 md:px-8 lg:px-12">
    <div class="flex flex-wrap items-start gap-6">
      <!-- Agenda: hoje (lista) ou semana (sessões por dia) -->
      <Card role="region" aria-labelledby="t-agenda" class="min-w-0 flex-[2_1_460px] animate-rise px-3 pb-3 pt-5 [animation-delay:.16s]">
        <Tabs v-model="view">
          <div class="flex items-center justify-between gap-3 px-2 pb-3">
            <h2 id="t-agenda" class="text-lg font-semibold tracking-[-0.01em]">Agenda</h2>
            <TabsList aria-label="Período" class="rounded-[10px] p-[3px]">
              <TabsTrigger value="dia" class="h-8 min-w-[72px] text-[13px]">Hoje</TabsTrigger>
              <TabsTrigger value="semana" class="h-8 min-w-[72px] text-[13px]">Semana</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dia" class="mt-0 animate-fade">
            <ol v-if="agenda.length" class="flex flex-col">
              <li v-for="row in agenda" :key="row.appointment.id">
                <NuxtLink
                  :to="`/appointments/${row.appointment.id}`"
                  class="flex items-center gap-3 rounded-xl px-3 py-3.5 transition-colors sm:gap-4 sm:px-4"
                  :class="row.state === 'now' ? 'bg-accent' : 'hover:bg-background'"
                >
                  <span class="w-12 shrink-0 font-mono text-[13px] text-secondary-foreground">{{ formatTime(row.appointment.scheduledFor) }}</span>
                  <span class="size-2.5 shrink-0 rounded-full" :class="dotClass[row.state]" aria-hidden="true" />
                  <span class="flex min-w-0 flex-1 flex-col">
                    <span class="truncate text-[15px] font-semibold">{{ row.appointment.patientName ?? 'Paciente' }}</span>
                    <span class="truncate text-[13px] text-muted-foreground">{{ modalityLabel(row.appointment.modality) }} · {{ row.appointment.durationMinutes }} min</span>
                  </span>
                  <span class="shrink-0 text-[13px] font-medium" :class="labelClass[row.state]">{{ row.label }}</span>
                </NuxtLink>
              </li>
            </ol>
            <EmptyState v-else compact class="mx-2 mb-2">
              Nenhuma sessão hoje.
            </EmptyState>
          </TabsContent>

          <TabsContent value="semana" class="mt-0 animate-fade">
            <div class="px-2 pb-1 pt-2">
              <div role="img" :aria-label="weekAria" class="grid h-[200px] grid-cols-7 items-end gap-2 sm:gap-3">
                <div v-for="(d, i) in week" :key="d.day" class="flex h-full flex-col items-center justify-end gap-2">
                  <span class="font-mono text-xs text-secondary-foreground">{{ d.count }}</span>
                  <div
                    class="bar w-full max-w-11 rounded-lg"
                    :class="d.isToday ? 'bg-primary' : 'bg-mood-2'"
                    :style="{ height: `${barHeight(d.count)}px`, animationDelay: `${i * 0.05}s` }"
                  />
                  <span
                    class="font-mono text-[11px] uppercase tracking-[.08em]"
                    :class="d.isToday ? 'font-medium text-accent-foreground' : 'text-muted-foreground'"
                  >{{ d.short }}</span>
                </div>
              </div>
              <p class="mt-4 text-[13px] text-muted-foreground">
                {{ plural(weekTotal, 'sessão', 'sessões') }} nesta semana
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <!-- Respostas aguardando revisão -->
      <Card role="region" aria-labelledby="t-rev" class="min-w-0 flex-[1_1_300px] animate-rise px-3 pb-3 pt-5 [animation-delay:.24s]">
        <div class="flex items-baseline justify-between px-2 pb-2">
          <h2 id="t-rev" class="text-lg font-semibold tracking-[-0.01em]">Para revisar</h2>
          <NuxtLink to="/activities" class="text-[13px] text-primary underline underline-offset-[3px] hover:text-accent-foreground">Ver todas</NuxtLink>
        </div>
        <template v-if="reviews.length">
          <NuxtLink
            v-for="a in reviews.slice(0, 4)"
            :key="a.id"
            :to="`/activities/${a.id}`"
            class="flex items-start gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-background"
          >
            <Avatar class="size-9">
              <AvatarFallback>{{ initials(a.patientName) }}</AvatarFallback>
            </Avatar>
            <span class="flex min-w-0 flex-col gap-0.5">
              <span class="truncate text-sm font-semibold">{{ a.title }}</span>
              <span class="truncate text-[13px] text-muted-foreground">
                {{ [a.patientName, relativeTimeLabel(a.respondedAt, now)].filter(Boolean).join(' · ') }}
              </span>
            </span>
          </NuxtLink>
        </template>
        <EmptyState v-else compact class="mx-2 mb-2">
          Nada aguardando revisão.
        </EmptyState>
      </Card>
    </div>

    <!-- Resumo do mês -->
    <section aria-label="Resumo do mês" class="grid animate-rise grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 [animation-delay:.4s]">
      <Card class="p-5">
        <StatCard label="Pacientes ativos" :value="activePatients.length" />
      </Card>
      <Card class="p-5">
        <StatCard :label="`Sessões em ${currentMonthName(now)}`" :value="monthSessions" />
      </Card>
      <Card class="p-5">
        <StatCard label="Atividades respondidas" :value="answeredRate == null ? '—' : `${answeredRate}%`" />
      </Card>
    </section>
  </div>
</template>

<style scoped>
/* Ponto da sessão em andamento e barras da semana (protótipo, Início). */
@keyframes now-pulse {
  0% { box-shadow: 0 0 0 0 hsl(var(--primary) / .45); }
  70% { box-shadow: 0 0 0 10px hsl(var(--primary) / 0); }
  100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0); }
}
.now-dot {
  animation: now-pulse 2.4s var(--ease-out) infinite;
}
@keyframes grow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
.bar {
  transform-origin: bottom;
  animation: grow .7s var(--ease-out) both;
}
</style>
