<script setup lang="ts">
import { ChevronRight, PenLine } from 'lucide-vue-next'
import { useNow } from '@vueuse/core'
import type { PatientPendingActivity } from '~/types'

// Atividades pendentes da paciente em cartões (protótipo: `.task`); `limit`
// mostra só as primeiras (Início). Prazo vencido aparece no tom de aviso.
const props = defineProps<{ activities: PatientPendingActivity[], limit?: number }>()
const shown = computed(() => props.limit ? props.activities.slice(0, props.limit) : props.activities)
const now = useNow({ interval: 60000 })

// "quinta-feira, 8 de outubro, 14h00" (horário de Brasília).
function formatDue(value: string) {
  const date = new Date(value)
  const day = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: APP_TIMEZONE }).format(date)
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE }).format(date).replace(':', 'h')
  return `${day}, ${time}`
}

function isLate(activity: PatientPendingActivity) {
  return !!activity.dueAt && new Date(activity.dueAt) < now.value
}

function dueText(activity: PatientPendingActivity) {
  if (!activity.dueAt) return 'Para fazer entre as sessões'
  return isLate(activity) ? `Atrasada · era até ${formatDue(activity.dueAt)}` : `Até ${formatDue(activity.dueAt)}`
}
</script>

<template>
  <ul v-if="shown.length" class="flex flex-col gap-3">
    <li v-for="(activity, index) in shown" :key="activity.id" class="animate-fade" :style="{ animationDelay: `${index * 60}ms` }">
      <NuxtLink
        :to="`/patient/activities/${activity.id}`"
        class="flex items-center gap-3.5 rounded-[14px] border bg-card p-4 transition-[border-color,transform] duration-300 ease-out hover:translate-x-0.5 hover:border-input-hover"
      >
        <span aria-hidden="true" class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <PenLine class="size-[18px]" :stroke-width="1.8" />
        </span>
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="text-[15px] font-semibold">{{ activity.title }}</span>
          <span :class="['text-[13px]', isLate(activity) ? 'font-medium text-warning' : 'text-muted-foreground']">{{ dueText(activity) }}</span>
        </span>
        <ChevronRight class="size-[18px] shrink-0 text-muted-foreground" :stroke-width="1.8" aria-hidden="true" />
      </NuxtLink>
    </li>
  </ul>
  <EmptyState v-else compact>
    Nenhuma atividade pendente. Quando sua(seu) psicóloga(o) enviar uma nova, ela aparece aqui.
  </EmptyState>
</template>
