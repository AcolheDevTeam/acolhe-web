<script setup lang="ts">
import { ArrowRight, Plus, Search } from 'lucide-vue-next'
import type { Patient, User } from '~/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const { data: me } = await useFetch<User>('/api/me', { key: 'me' })
const { data: allSessions } = useSessions()
const { data: allActivities } = useActivities()
const { data: patients } = await useFetch<Patient[]>('/api/patients', {
  key: 'patients-list',
  default: () => [],
})

const firstName = computed(() => me.value?.name?.split(' ')[0] ?? '')
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
})
const today = computed(() => {
  const s = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return s.charAt(0).toUpperCase() + s.slice(1)
})

const sessionsToday = computed(() => {
  const now = new Date()
  return (allSessions.value ?? []).filter((session) => {
    const occurredAt = new Date(session.occurredAt)
    return occurredAt.getFullYear() === now.getFullYear()
      && occurredAt.getMonth() === now.getMonth()
      && occurredAt.getDate() === now.getDate()
  })
})
const reviews = computed(() => (allActivities.value ?? []).filter(activity => activity.status === 'submitted'))
const activePatients = computed(() => (patients.value ?? []).filter((p) => p.status === 'active'))
const avgAdherence = computed(() => {
  const vals = (patients.value ?? []).map((p) => p.adherence).filter((v): v is number => v != null)
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
})
</script>

<template>
  <PageHeader title="Início">
    <template #actions>
      <div class="relative hidden w-56 lg:block">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar…" class="pl-9" />
        <kbd class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[0.625rem] text-muted-foreground">
          ⌘K
        </kbd>
      </div>
      <NewSessionDialog>
        <Button variant="outline" size="sm">
          <Plus />
          Nova sessão
        </Button>
      </NewSessionDialog>
      <NewPatientDialog>
        <Button size="sm">
          <Plus />
          Novo paciente
        </Button>
      </NewPatientDialog>
    </template>
  </PageHeader>

  <div class="grid flex-1 gap-10 px-8 py-8 lg:grid-cols-[1fr_320px]">
    <!-- Coluna principal -->
    <div class="flex flex-col gap-10">
      <div class="flex flex-col gap-2">
        <p class="text-sm text-muted-foreground">{{ today }}</p>
        <h1 class="display-serif text-4xl">{{ greeting }}{{ firstName ? `, ${firstName}` : '' }}.</h1>
        <p class="max-w-xl text-sm text-muted-foreground">
          Você tem <span class="font-medium text-foreground">{{ sessionsToday.length }} sessões hoje</span>,
          {{ reviews.length }} atividades aguardando revisão.
        </p>
      </div>

      <section class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <p class="label-mono">Agenda · hoje</p>
          <NuxtLink to="/agenda" class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            Ver semana
            <ArrowRight class="size-3" />
          </NuxtLink>
        </div>
        <div v-if="sessionsToday.length" class="flex flex-col gap-2">
          <SessionRow v-for="s in sessionsToday" :key="s.id" :session="s" />
        </div>
        <p v-else class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma sessão agendada para hoje.
        </p>
      </section>

      <section class="flex flex-col gap-3">
        <p class="label-mono">Aguardando revisão · {{ reviews.length }}</p>
        <div v-if="reviews.length" class="flex flex-col gap-2">
          <ActivityRow v-for="a in reviews" :key="a.id" :activity="a" show-patient />
        </div>
        <p v-else class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nada aguardando revisão.
        </p>
      </section>
    </div>

    <!-- Coluna lateral -->
    <aside class="flex flex-col gap-8">
      <section class="flex flex-col gap-4">
        <p class="label-mono">Resumo</p>
        <div class="grid grid-cols-2 gap-x-4 gap-y-6">
          <StatCard label="Pacientes ativos" :value="activePatients.length" />
          <StatCard label="Sessões hoje" :value="sessionsToday.length" />
          <StatCard label="Adesão a tarefas" :value="avgAdherence == null ? '—' : `${avgAdherence}%`" />
          <StatCard label="Aguardando revisão" :value="reviews.length" />
        </div>
      </section>

      <Separator />

      <section class="flex flex-col gap-3">
        <p class="label-mono">Notas</p>
        <p class="border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">
          Use este espaço para lembretes clínicos rápidos. As anotações ficam visíveis apenas para você.
        </p>
      </section>
    </aside>
  </div>
</template>
