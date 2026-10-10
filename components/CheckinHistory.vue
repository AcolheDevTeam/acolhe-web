<script setup lang="ts">
import type { PatientCheckin } from '~/types'
defineProps<{ items: PatientCheckin[], emptyMessage?: string }>()

function sleepLine(item: PatientCheckin): string | null {
  const parts: string[] = []
  const minutes = checkinSleepMinutes(item)
  if (item.sleepBedtime && item.sleepWakeTime) parts.push(`das ${clockLabel(item.sleepBedtime)} às ${clockLabel(item.sleepWakeTime)}`)
  if (minutes != null) parts.push(durationLabel(minutes))
  if (item.sleepQuality != null) parts.push(`qualidade ${item.sleepQuality} de 5`)
  return parts.length ? parts.join(' · ') : null
}
</script>

<template>
  <div v-if="items.length" class="max-h-[28rem] divide-y overflow-y-auto" aria-label="Histórico de check-ins">
    <article v-for="item in items" :key="item.id" class="flex flex-col gap-2 py-4 first:pt-0">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm font-medium">{{ checkinDateLabel(item.day) }}</p>
        <p class="font-mono text-sm tabular-nums" :aria-label="`Humor ${moodLabel(item.mood).toLowerCase()}, ${item.mood} de 5`">{{ moodLabel(item.mood) }} · {{ item.mood }} / 5</p>
      </div>
      <p v-if="sleepLine(item)" class="text-sm text-secondary-foreground"><span class="text-muted-foreground">Sono:</span> {{ sleepLine(item) }}</p>
      <p v-if="item.feelings?.length" class="text-sm text-secondary-foreground"><span class="text-muted-foreground">Sentimentos:</span> {{ item.feelings.map(feelingLabel).join(', ') }}</p>
      <p v-if="item.note" class="whitespace-pre-wrap break-words text-sm leading-relaxed">{{ item.note }}</p>
      <p v-else class="text-xs text-muted-foreground">Sem observação.</p>
      <p v-if="new Date(item.updatedAt).getTime() > new Date(item.createdAt).getTime()" class="text-xs text-muted-foreground">Editado no dia do registro.</p>
    </article>
  </div>
  <p v-else class="text-sm leading-relaxed text-muted-foreground">{{ emptyMessage ?? 'Nenhum check-in registrado ainda.' }}</p>
</template>
