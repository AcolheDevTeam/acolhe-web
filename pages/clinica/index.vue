<script setup lang="ts">
import type { ClinicOverview } from '~/schemas/clinic'
import { Button } from '@/components/ui/button'

// Números da clínica (ACO-62). A administração vê só números por profissional,
// nenhum dado de paciente (decisão de 2026-10-09, ADR 0002 da API). O design
// v0.3 não tem esta tela; segue o padrão do painel (PageHeader, StatCard).
definePageMeta({ middleware: ['auth', 'clinic-admin'] })

const { data: overview, error, status, refresh } = useFetch<ClinicOverview>('/api/clinic/overview', {
  key: 'clinic-overview',
  default: () => ({ professionals: [] }),
})
const professionals = computed(() => overview.value?.professionals ?? [])
const totals = computed(() => professionals.value.reduce((sum, p) => ({
  patients: sum.patients + p.activePatients,
  sessions: sum.sessions + p.sessionsLast30Days,
  upcoming: sum.upcoming + p.upcomingAppointments,
}), { patients: 0, sessions: 0, upcoming: 0 }))
</script>

<template>
  <PageHeader eyebrow="Clínica" title="Painel da clínica">
    <template #actions>
      <Button variant="outline" size="sm" as-child><NuxtLink to="/clinica/equipe">Equipe</NuxtLink></Button>
    </template>
  </PageHeader>
  <div class="flex flex-col gap-8 px-4 py-6 md:px-8 md:py-8 lg:px-12">
    <div v-if="error" class="flex flex-col items-start gap-3 text-sm" role="alert">
      <p class="text-destructive">{{ clinicErrorMessage(error, 'Não foi possível carregar os números da clínica.') }}</p>
      <Button variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <p v-else-if="status === 'pending'" class="text-sm text-muted-foreground">Carregando números…</p>
    <template v-else>
      <section class="grid gap-6 rounded-xl border bg-card p-5 sm:grid-cols-3">
        <StatCard label="Pacientes ativos" :value="totals.patients" />
        <StatCard label="Sessões em 30 dias" :value="totals.sessions" />
        <StatCard label="Consultas agendadas" :value="totals.upcoming" />
      </section>
      <section class="flex flex-col gap-3">
        <p class="label-mono">Por profissional</p>
        <p class="text-sm text-muted-foreground">Só números: dados de pacientes ficam restritos a quem atende.</p>
        <EmptyState v-if="!professionals.length" compact>
          Ainda não há profissionais atendendo. Convide a equipe em <NuxtLink to="/clinica/equipe" class="underline underline-offset-4">Equipe</NuxtLink>.
        </EmptyState>
        <ul v-else class="divide-y rounded-xl border bg-card">
          <li v-for="p in professionals" :key="p.userId" class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ p.fullName }}</p>
              <p v-if="p.membershipStatus !== 'active'" class="text-xs text-muted-foreground">{{ membershipStatusLabel(p.membershipStatus) }}</p>
            </div>
            <dl class="grid grid-cols-3 gap-4 text-sm sm:w-96">
              <div><dt class="text-xs text-muted-foreground">Pacientes</dt><dd class="font-serif text-xl">{{ p.activePatients }}</dd></div>
              <div><dt class="text-xs text-muted-foreground">Sessões 30d</dt><dd class="font-serif text-xl">{{ p.sessionsLast30Days }}</dd></div>
              <div><dt class="text-xs text-muted-foreground">Agendadas</dt><dd class="font-serif text-xl">{{ p.upcomingAppointments }}</dd></div>
            </dl>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
