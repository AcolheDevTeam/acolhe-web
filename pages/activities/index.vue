<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'psychologist-only'],
})

const { data: templates } = useActivityTemplates()
</script>

<template>
  <main class="mx-auto max-w-4xl p-6">
    <h1 class="text-2xl font-semibold">Templates de atividade</h1>
    <p class="mt-2 text-sm text-gray-500">
      Catálogo da organização. A atribuição a pacientes depende de um endpoint de
      criação de atribuição na API (ainda não disponível).
    </p>

    <ul class="mt-4 divide-y rounded border">
      <li v-for="t in templates" :key="t.id" class="px-4 py-3">
        <p class="font-medium">{{ t.title }}</p>
        <p v-if="t.description" class="text-sm text-gray-600">{{ t.description }}</p>
        <span class="text-xs text-gray-400">v{{ t.version }}</span>
      </li>
      <li v-if="!templates?.length" class="px-4 py-3 text-gray-500">Nenhum template disponível.</li>
    </ul>
  </main>
</template>
