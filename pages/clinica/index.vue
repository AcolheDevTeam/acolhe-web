<script setup lang="ts">
import { LockKeyhole } from 'lucide-vue-next'
import type { ClinicOverview } from '~/schemas/clinic'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Números da clínica (ACO-62), no layout do protótipo "Painel da clínica". A
// administração vê só números por profissional, nenhum dado de paciente
// (decisão de 2026-10-09, ADR 0002 da API). A API dá uma janela fixa de 30
// dias, então não há o seletor Semana/Mês, faltas nem ocupação.
definePageMeta({ middleware: ['auth', 'clinic-admin'] })

const { workspaces } = useWorkspaces()
const clinicName = computed(() => workspaces.value.find(w => w.current)?.name)

const { data: overview, error, status, refresh } = useFetch<ClinicOverview>('/api/clinic/overview', {
  key: 'clinic-overview',
  default: () => ({ professionals: [] }),
})
const professionals = computed(() => overview.value?.professionals ?? [])
const activeCount = computed(() => professionals.value.filter(p => p.membershipStatus === 'active').length)
const totals = computed(() => professionals.value.reduce((sum, p) => ({
  patients: sum.patients + p.activePatients,
  sessions: sum.sessions + p.sessionsLast30Days,
  upcoming: sum.upcoming + p.upcomingAppointments,
}), { patients: 0, sessions: 0, upcoming: 0 }))

const eyebrow = computed(() => {
  const count = `${activeCount.value} ${activeCount.value === 1 ? 'psicóloga' : 'psicólogas'}`
  if (status.value === 'pending' || error.value) return clinicName.value ?? 'Clínica'
  return clinicName.value ? `${clinicName.value} · ${count}` : count
})

// Barras do gráfico: altura proporcional ao maior número (mínimo visível de 4px).
const maxSessions = computed(() => Math.max(1, ...professionals.value.map(p => p.sessionsLast30Days)))
function barHeight(value: number) {
  return Math.max(4, Math.round(value / maxSessions.value * 180))
}
const chartLabel = computed(() => `Sessões nos últimos 30 dias por psicóloga: ${professionals.value.map(p => `${p.fullName} ${p.sessionsLast30Days}`).join('; ')}`)
</script>

<template>
  <PageHeader :eyebrow="eyebrow" title="Painel da clínica">
    <template #actions>
      <Button variant="outline" as-child><NuxtLink to="/clinica/equipe">Gerenciar equipe</NuxtLink></Button>
    </template>
  </PageHeader>
  <div class="flex flex-col gap-7 px-4 pb-14 pt-7 md:px-8 lg:px-12">
    <InlineNotice class="flex animate-rise items-start gap-3 [animation-delay:.05s]">
      <LockKeyhole class="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
      <p>Este painel mostra só dados administrativos. Prontuários, atividades e registros das pacientes não aparecem aqui.</p>
    </InlineNotice>

    <div v-if="error" class="flex flex-col items-start gap-3 text-sm" role="alert">
      <p class="text-destructive">{{ clinicErrorMessage(error, 'Não foi possível carregar os números da clínica.') }}</p>
      <Button variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <p v-else-if="status === 'pending'" class="text-sm text-muted-foreground">Carregando números…</p>
    <template v-else>
      <section aria-label="Resumo dos últimos 30 dias" class="grid animate-rise gap-4 [animation-delay:.1s] [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
        <Card class="p-5"><StatCard label="Sessões" :value="totals.sessions" hint="nos últimos 30 dias" /></Card>
        <Card class="p-5"><StatCard label="Consultas agendadas" :value="totals.upcoming" hint="próximas na agenda" /></Card>
        <Card class="p-5"><StatCard label="Pacientes ativos" :value="totals.patients" hint="na clínica" /></Card>
      </section>

      <EmptyState v-if="!professionals.length" title="Ainda não há profissionais atendendo">
        Convide a equipe para ver os números por psicóloga aqui.
        <template #action>
          <Button variant="outline" as-child><NuxtLink to="/clinica/equipe">Gerenciar equipe</NuxtLink></Button>
        </template>
      </EmptyState>
      <template v-else>
        <Card role="region" aria-labelledby="t-chart" class="flex animate-rise flex-col gap-5 p-6 [animation-delay:.16s]">
          <h2 id="t-chart" class="text-lg font-semibold tracking-[-0.01em]">Sessões por psicóloga</h2>
          <div class="overflow-x-auto">
            <div
              role="img"
              :aria-label="chartLabel"
              class="grid h-[260px] items-end gap-6"
              :style="{ gridTemplateColumns: `repeat(${professionals.length}, minmax(72px, 1fr))` }"
            >
              <div v-for="(p, i) in professionals" :key="p.userId" class="flex h-full min-w-0 flex-col items-center justify-end gap-2.5">
                <span class="font-mono text-xs">{{ p.sessionsLast30Days }}</span>
                <div class="bar w-10 rounded-t-lg rounded-b-sm bg-primary" :style="{ height: `${barHeight(p.sessionsLast30Days)}px`, animationDelay: `${i * 0.08}s` }" />
                <span class="max-w-full truncate text-sm font-medium">{{ p.fullName.split(' ')[0] }}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card role="region" aria-labelledby="t-tab" class="animate-rise overflow-hidden pt-2 [animation-delay:.22s]">
          <h2 id="t-tab" class="px-4 pb-2 pt-3.5 text-lg font-semibold tracking-[-0.01em]">Por psicóloga</h2>
          <Table class="min-w-[560px]">
            <TableHeader>
              <TableRow class="border-border hover:bg-transparent">
                <TableHead>Psicóloga</TableHead>
                <TableHead>Sessões em 30 dias</TableHead>
                <TableHead>Agendadas</TableHead>
                <TableHead>Pacientes ativos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="p in professionals" :key="p.userId" class="animate-fade last:border-0">
                <TableCell>
                  <span class="flex flex-wrap items-center gap-2">
                    <span class="font-semibold">{{ p.fullName }}</span>
                    <Badge v-if="p.membershipStatus !== 'active'" variant="neutral">{{ membershipStatusLabel(p.membershipStatus) }}</Badge>
                  </span>
                </TableCell>
                <TableCell class="font-mono">{{ p.sessionsLast30Days }}</TableCell>
                <TableCell class="font-mono">{{ p.upcomingAppointments }}</TableCell>
                <TableCell class="font-mono">{{ p.activePatients }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </template>
    </template>
  </div>
</template>

<style scoped>
/* Barras do gráfico crescem de baixo (protótipo, Painel da clínica). */
@keyframes grow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
.bar {
  transform-origin: bottom;
  animation: grow .7s var(--ease-out) both;
}
</style>
