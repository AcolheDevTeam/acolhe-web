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

    <!-- Timeline é leitura pura — lazy/island para não hidratar à toa. -->
    <!-- <LazyPatientTimeline :patient-id="patient?.id" /> -->
  </main>
</template>
