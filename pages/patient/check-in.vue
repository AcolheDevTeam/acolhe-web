<script setup lang="ts">
import { Eye } from 'lucide-vue-next'
import { useNow } from '@vueuse/core'

definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

const { checkins, summary, pending, error } = usePatientPortal()
const eyebrow = patientEyebrowDate()
const now = useNow({ interval: 60000 })

// Protótipo: últimos 14 dias em duas semanas e a média dos últimos 7.
const days = computed(() => recentCheckinDays(checkins.data.value ?? [], 14, now.value))
const weekAverage = computed(() => moodAverageLabel(days.value.slice(7)))
const emptyDays = computed(() => days.value.filter(day => day.mood === null).length)
const shades = ['bg-mood-1', 'bg-mood-2', 'bg-mood-3', 'bg-mood-4', 'bg-mood-5']

async function onCheckinSaved() {
  await Promise.all([checkins.refresh(), summary.refresh()])
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <PatientPageHeader :eyebrow="eyebrow" title="Check-in de hoje">
      <template #description><Eye class="size-3.5" aria-hidden="true" />Visível para você e sua psicóloga</template>
    </PatientPageHeader>
    <PortalLoadState :pending="pending" :error="error">
      <div class="flex flex-col gap-5">
        <PatientCheckinCard
          class="animate-rise [animation-delay:60ms]"
          variant="full"
          :checkins="checkins.data.value ?? []"
          @saved="onCheckinSaved"
          @conflict="checkins.refresh()"
        />

        <section class="animate-rise flex flex-col gap-3.5 rounded-2xl border bg-card p-[18px] [animation-delay:120ms]" aria-labelledby="t-14dias">
          <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id="t-14dias" class="text-base font-semibold">Últimos 14 dias</h2>
            <span class="text-[13px] text-secondary-foreground">Média da semana <strong class="font-semibold text-foreground">{{ weekAverage ?? '—' }}</strong></span>
          </div>
          <div role="img" :aria-label="`Humor dos últimos 14 dias. ${emptyDays} dias sem registro.`" class="grid max-w-[420px] grid-cols-7 gap-1.5">
            <div v-for="cell in days" :key="cell.day" class="flex flex-col items-center gap-1">
              <span
                :class="['aspect-square w-full rounded-lg', cell.mood ? shades[cell.mood - 1] : 'border border-dashed border-input-hover']"
                :title="cell.mood ? `${checkinDateLabel(cell.day)}: ${moodLabel(cell.mood)}` : `${checkinDateLabel(cell.day)}: sem registro`"
              />
              <span class="font-mono text-[10px] text-muted-foreground">{{ cell.weekday }}</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>Difícil</span>
            <span v-for="shade in shades" :key="shade" aria-hidden="true" :class="['size-3.5 rounded', shade]" />
            <span>Bem</span>
            <span class="ml-2 inline-flex items-center gap-1"><span aria-hidden="true" class="size-3.5 rounded border border-dashed border-input-hover" />sem registro</span>
          </div>
        </section>

        <section class="animate-rise flex flex-col gap-3 [animation-delay:180ms]" aria-labelledby="t-historico">
          <h2 id="t-historico" class="label-mono">Seus registros</h2>
          <div class="rounded-2xl border bg-card p-5">
            <CheckinHistory :items="checkins.data.value ?? []" />
          </div>
        </section>
      </div>
    </PortalLoadState>
  </div>
</template>
