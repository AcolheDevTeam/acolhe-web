<script setup lang="ts">
import type { Appointment } from '~/types'
import { cn } from '@/lib/utils'

// Linha de agendamento (.row do protótipo). Com `selectable` vira botão e
// emite `select` (painel da agenda); sem, leva ao detalhe do agendamento.
const { appointment, selectable = false } = defineProps<{ appointment: Appointment, selectable?: boolean }>()
defineEmits<{ select: [appointment: Appointment] }>()
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <component
    :is="selectable ? 'button' : NuxtLink"
    v-bind="selectable ? { type: 'button' } : { to: `/appointments/${appointment.id}` }"
    class="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
    @click="selectable && $emit('select', appointment)"
  >
    <span class="w-11 shrink-0 font-mono text-[13px] tabular-nums text-muted-foreground">{{ formatTime(appointment.scheduledFor) }}</span>
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span class="truncate text-[15px] font-semibold">{{ appointment.patientName ?? 'Paciente' }}</span>
      <span class="truncate text-[13px] text-muted-foreground">{{ modalityLabel(appointment.modality) }} · {{ appointment.durationMinutes }} min</span>
    </span>
    <span :class="cn('inline-flex h-[26px] shrink-0 items-center rounded-full px-2.5 text-xs font-medium', appointmentTone(appointment.status))">
      {{ appointmentStatusLabel(appointment.status) }}
    </span>
  </component>
</template>
