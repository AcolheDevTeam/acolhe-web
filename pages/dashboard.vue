<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const { data: user } = await useFetch('/api/me')
</script>

<template>
  <main class="mx-auto max-w-4xl p-6">
    <h1 class="text-2xl font-semibold">Dashboard</h1>
    <p class="mt-2 text-gray-600">Bem-vindo(a), {{ user?.email }}.</p>

    <nav class="mt-6 flex gap-4">
      <NuxtLink to="/patients" class="text-emerald-700 underline">Pacientes</NuxtLink>
      <NuxtLink to="/sessions" class="text-emerald-700 underline">Sessões</NuxtLink>
      <NuxtLink to="/activities" class="text-emerald-700 underline">Atividades</NuxtLink>
    </nav>
  </main>
</template>
