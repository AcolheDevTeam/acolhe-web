<script setup lang="ts">
definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

const { checkins, summary, pending, error } = usePatientPortal()
const eyebrow = patientEyebrowDate()

async function onCheckinSaved() {
  await Promise.all([checkins.refresh(), summary.refresh()])
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <PatientPageHeader :eyebrow="eyebrow" title="Check-in de hoje" description="Visível para você e sua psicóloga." />
    <PortalLoadState :pending="pending" :error="error">
      <PatientCheckinCard
        :checkins="checkins.data.value ?? []"
        @saved="onCheckinSaved"
        @conflict="checkins.refresh()"
      />
      <section class="mt-6 flex flex-col gap-3" aria-labelledby="t-historico">
        <h2 id="t-historico" class="label-mono">Seu histórico de check-ins</h2>
        <div class="rounded-2xl border bg-card p-5">
          <CheckinHistory :items="checkins.data.value ?? []" />
        </div>
      </section>
    </PortalLoadState>
  </div>
</template>
