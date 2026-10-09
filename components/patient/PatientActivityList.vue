<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import type { PatientPendingActivity } from '~/types'

// Atividades pendentes da paciente; `limit` mostra só as primeiras (Início).
const props = defineProps<{ activities: PatientPendingActivity[], limit?: number }>()
const shown = computed(() => props.limit ? props.activities.slice(0, props.limit) : props.activities)

function formatDue(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: APP_TIMEZONE }).format(new Date(value))
}
</script>

<template>
  <ul v-if="shown.length" class="flex flex-col divide-y overflow-hidden rounded-2xl border bg-card">
    <li v-for="activity in shown" :key="activity.id">
      <NuxtLink
        :to="`/patient/activities/${activity.id}`"
        class="flex min-h-16 items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-surface-subtle"
      >
        <span class="min-w-0">
          <span class="block truncate text-[15px] font-semibold">{{ activity.title }}</span>
          <span class="mt-0.5 block text-[13px] text-muted-foreground">
            {{ activity.dueAt ? `Até ${formatDue(activity.dueAt)}` : 'Para fazer entre as sessões' }}
          </span>
        </span>
        <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
      </NuxtLink>
    </li>
  </ul>
  <EmptyState v-else compact>
    Nenhuma atividade pendente. Quando sua psicóloga enviar uma nova, ela aparece aqui.
  </EmptyState>
</template>
