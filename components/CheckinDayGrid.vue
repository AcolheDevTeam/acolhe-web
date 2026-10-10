<script setup lang="ts">
import { useNow } from '@vueuse/core'

// Grade de humor por dia (protótipo: "Últimos 14 dias" da paciente e
// "Check-ins dos últimos 35 dias" da ficha). Uma célula por dia, a mais
// recente por último; dia sem check-in fica tracejado. Para leitores de tela é
// uma lista com a data e o humor de cada dia.
const props = withDefaults(defineProps<{
  checkins: { day: string, mood: number }[]
  days?: number
  label: string
  weekdays?: boolean
}>(), { days: 14, weekdays: false })

const now = useNow({ interval: 60000 })
const cells = computed(() => recentCheckinDays(props.checkins, props.days, now.value))
const emptyDays = computed(() => cells.value.filter(cell => cell.mood === null).length)
const summaryId = useId()
const shades = ['bg-mood-1', 'bg-mood-2', 'bg-mood-3', 'bg-mood-4', 'bg-mood-5']
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <p :id="summaryId" class="sr-only">{{ emptyDays }} de {{ days }} dias sem check-in.</p>
    <ol class="grid max-w-[420px] grid-cols-7 gap-1.5" :aria-label="label" :aria-describedby="summaryId">
      <li v-for="cell in cells" :key="cell.day" class="flex flex-col items-center gap-1">
        <span class="sr-only">{{ checkinDateLabel(cell.day) }}: {{ cell.mood ? `humor ${moodLabel(cell.mood).toLowerCase()} (${cell.mood} de 5)` : 'sem check-in' }}</span>
        <span
          aria-hidden="true"
          :class="['aspect-square w-full rounded-lg', cell.mood ? shades[cell.mood - 1] : 'border border-dashed border-input-hover']"
          :title="cell.mood ? `${checkinDateLabel(cell.day)}: ${moodLabel(cell.mood)}` : `${checkinDateLabel(cell.day)}: sem check-in`"
        />
        <span v-if="weekdays" aria-hidden="true" class="font-mono text-[10px] text-muted-foreground">{{ cell.weekday }}</span>
      </li>
    </ol>
    <div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground" aria-hidden="true">
      <span>Difícil</span>
      <span v-for="shade in shades" :key="shade" :class="['size-3.5 rounded', shade]" />
      <span>Bem</span>
      <span class="ml-2 inline-flex items-center gap-1"><span class="size-3.5 rounded border border-dashed border-input-hover" />sem registro</span>
    </div>
  </div>
</template>
