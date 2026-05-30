<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'psychologist-only'],
})

const route = useRoute()
const patientId = computed(() => route.params.id as string)

const { data: patient } = usePatient(patientId)
const { data: sessions } = usePatientSessions(patientId)

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <main class="mx-auto max-w-4xl p-6">
    <NuxtLink :to="`/patients/${patientId}`" class="text-sm text-emerald-700">← {{ patient?.fullName }}</NuxtLink>

    <div class="mt-2 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Sessões</h1>
      <NuxtLink
        :to="{ path: '/sessions/new', query: { patient: patientId } }"
        class="rounded bg-emerald-600 px-4 py-2 text-sm text-white"
      >
        Nova sessão
      </NuxtLink>
    </div>

    <ul class="mt-4 divide-y rounded border">
      <li
        v-for="s in sessions"
        :key="s.id"
        class="flex items-center justify-between px-4 py-3"
      >
        <span class="text-sm text-gray-700">{{ formatDate(s.occurredAt) }}</span>
        <span class="text-sm text-gray-500">{{ s.status }}</span>
      </li>
      <li v-if="!sessions?.length" class="px-4 py-3 text-gray-500">Nenhuma sessão registrada.</li>
    </ul>
  </main>
</template>
