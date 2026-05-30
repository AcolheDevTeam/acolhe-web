<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'psychologist-only'],
})

const route = useRoute()
const patientId = computed(() => route.params.id as string)

const { data: patient } = usePatient(patientId)
const { data: assignments } = usePatientAssignments(patientId)

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<template>
  <main class="mx-auto max-w-4xl p-6">
    <NuxtLink :to="`/patients/${patientId}`" class="text-sm text-emerald-700">← {{ patient?.fullName }}</NuxtLink>
    <h1 class="mt-2 text-2xl font-semibold">Atividades</h1>

    <ul class="mt-4 divide-y rounded border">
      <li
        v-for="a in assignments"
        :key="a.id"
        class="flex items-center justify-between px-4 py-3"
      >
        <NuxtLink :to="`/activities/${a.id}`" class="text-emerald-700">
          Atribuição · vence {{ formatDate(a.dueAt) }}
        </NuxtLink>
        <span class="text-sm text-gray-500">{{ a.status }}</span>
      </li>
      <li v-if="!assignments?.length" class="px-4 py-3 text-gray-500">Nenhuma atividade atribuída.</li>
    </ul>
  </main>
</template>
