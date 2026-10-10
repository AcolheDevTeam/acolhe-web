<script setup lang="ts">
import { useNow } from '@vueuse/core'
import type { PatientCheckin } from '~/types'

// Médias dos últimos `days` dias, só do que foi registrado (ACO-103). Cada
// número diz de quantos dias saiu; o que não tem registro não aparece.
const props = withDefaults(defineProps<{ checkins: PatientCheckin[], days?: number }>(), { days: 14 })

const now = useNow({ interval: 60000 })
const averages = computed(() => checkinAverages(props.checkins, props.days, now.value))
const dayWord = (n: number) => n === 1 ? 'dia' : 'dias'
</script>

<template>
  <dl v-if="averages.count" class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
    <div class="flex flex-col gap-0.5">
      <dt class="label-mono">Humor médio</dt>
      <dd class="text-base font-semibold">{{ scoreLabel(averages.mood!) }}</dd>
      <dd class="text-xs text-muted-foreground">{{ averages.count }} {{ dayWord(averages.count) }} com registro</dd>
    </div>
    <div v-if="averages.sleepMinutes != null" class="flex flex-col gap-0.5">
      <dt class="label-mono">Sono médio</dt>
      <dd class="text-base font-semibold"><span aria-hidden="true">{{ durationLabel(averages.sleepMinutes) }}</span><span class="sr-only">{{ durationSpoken(averages.sleepMinutes) }}</span></dd>
      <dd class="text-xs text-muted-foreground">{{ averages.sleepCount }} {{ dayWord(averages.sleepCount) }} com horário</dd>
    </div>
    <div v-if="averages.sleepQuality != null" class="flex flex-col gap-0.5">
      <dt class="label-mono">Qualidade do sono</dt>
      <dd class="text-base font-semibold">{{ scoreLabel(averages.sleepQuality) }}</dd>
      <dd class="text-xs text-muted-foreground">{{ averages.qualityCount }} {{ dayWord(averages.qualityCount) }} com nota</dd>
    </div>
  </dl>
  <p v-else class="text-sm text-muted-foreground">Nenhum check-in nos últimos {{ days }} dias.</p>
</template>
