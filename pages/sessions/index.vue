<script setup lang="ts">
import type { Patient } from '~/types'

definePageMeta({
  middleware: ['auth', 'psychologist-only'],
})

// As sessões são acessadas por paciente — a API não expõe uma lista global.
// Esta página serve de entrada: escolha o paciente para ver/registrar sessões.
const { data: patients } = await useFetch<Patient[]>('/api/patients', {
  key: 'patients-list',
})
</script>

<template>
  <main class="mx-auto max-w-4xl p-6">
    <h1 class="text-2xl font-semibold">Sessões</h1>
    <p class="mt-2 text-gray-600">Selecione um paciente para ver ou registrar sessões.</p>

    <ul class="mt-4 divide-y rounded border">
      <li v-for="p in patients" :key="p.id" class="px-4 py-3">
        <NuxtLink :to="`/patients/${p.id}/sessions`" class="text-emerald-700">{{ p.fullName }}</NuxtLink>
        <span class="ml-2 text-sm text-gray-500">{{ p.status }}</span>
      </li>
      <li v-if="!patients?.length" class="px-4 py-3 text-gray-500">Nenhum paciente ainda.</li>
    </ul>
  </main>
</template>
