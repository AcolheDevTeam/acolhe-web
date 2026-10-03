<script setup lang="ts">
import type { Appointment } from '~/types'
import { Badge } from '@/components/ui/badge'
const { appointment } = defineProps<{ appointment: Appointment }>()
</script>

<template>
  <NuxtLink :to="`/appointments/${appointment.id}`"
    class="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40">
    <span class="shrink-0 font-mono text-sm text-muted-foreground">{{ formatTime(appointment.scheduledFor) }}</span>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium">{{ appointment.patientName ?? 'Paciente' }}</p>
      <p class="text-xs text-muted-foreground">{{ modalityLabel(appointment.modality) }} · {{ appointment.durationMinutes }} min</p>
    </div>
    <Badge variant="outline">{{ appointmentStatusLabel(appointment.status) }}</Badge>
  </NuxtLink>
</template>
