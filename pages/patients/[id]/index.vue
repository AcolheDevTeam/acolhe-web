<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'psychologist-only'],
})

const route = useRoute()
const { data: patient } = usePatient(() => route.params.id as string)
</script>

<template>
  <main class="mx-auto max-w-4xl p-6">
    <NuxtLink to="/patients" class="text-sm text-emerald-700">← Pacientes</NuxtLink>
    <h1 class="mt-2 text-2xl font-semibold">{{ patient?.fullName }}</h1>
    <p class="text-gray-600">Status: {{ patient?.status }}</p>

    <nav class="mt-4 flex gap-4 border-b pb-3 text-sm">
      <NuxtLink :to="`/patients/${route.params.id}/sessions`" class="text-emerald-700">Sessões</NuxtLink>
      <NuxtLink :to="`/patients/${route.params.id}/activities`" class="text-emerald-700">Atividades</NuxtLink>
    </nav>

    <!-- Timeline é leitura pura — lazy para não hidratar à toa (spec §2.1). -->
    <LazyPatientTimeline v-if="patient" :patient-id="patient.id" />
  </main>
</template>
