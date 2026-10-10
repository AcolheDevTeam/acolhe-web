<script setup lang="ts">
import { Eye } from 'lucide-vue-next'

definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

const { checkins, pending, error } = usePatientPortal()
const eyebrow = patientEyebrowDate()

async function onCheckinSaved() {
  await checkins.refresh()
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <PatientPageHeader :eyebrow="eyebrow" title="Check-in de hoje">
      <template #description><Eye class="size-3.5" aria-hidden="true" />Visível para você e sua(seu) psicóloga(o)</template>
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

        <!-- Protótipo: humor dos últimos 14 dias. ACO-103: médias de humor e sono do mesmo período. -->
        <section class="animate-rise flex flex-col gap-4 rounded-2xl border bg-card p-[18px] [animation-delay:120ms]" aria-labelledby="t-14dias">
          <h2 id="t-14dias" class="text-base font-semibold">Últimos 14 dias</h2>
          <CheckinAverages :checkins="checkins.data.value ?? []" :days="14" />
          <CheckinDayGrid :checkins="checkins.data.value ?? []" :days="14" label="Humor dos últimos 14 dias" weekdays />
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
