<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'psychologist-only'],
})

const route = useRoute()
const assignmentId = computed(() => route.params.id as string)

const { data: responses, refresh } = useAssignmentResponses(assignmentId)

const submitting = ref(false)
const submitError = ref('')

async function submitResponse() {
  submitting.value = true
  submitError.value = ''
  try {
    await $fetch(`/api/activities/assignments/${assignmentId.value}/responses`, { method: 'POST' })
    await refresh()
  } catch {
    submitError.value = 'Não foi possível submeter a resposta.'
  } finally {
    submitting.value = false
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
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
  <main class="mx-auto max-w-3xl p-6">
    <NuxtLink to="/activities" class="text-sm text-emerald-700">← Atividades</NuxtLink>

    <div class="mt-2 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Respostas</h1>
      <button
        type="button"
        :disabled="submitting"
        class="rounded bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        @click="submitResponse"
      >
        {{ submitting ? 'Enviando…' : 'Nova resposta' }}
      </button>
    </div>

    <p v-if="submitError" class="mt-2 text-sm text-red-600">{{ submitError }}</p>

    <ul class="mt-4 divide-y rounded border">
      <li
        v-for="r in responses"
        :key="r.id"
        class="flex items-center justify-between px-4 py-3"
      >
        <span class="text-sm text-gray-700">
          {{ r.submittedAt ? `Submetida em ${formatDate(r.submittedAt)}` : 'Não submetida' }}
        </span>
        <span class="text-sm text-gray-500">{{ r.isDraft ? 'Rascunho' : 'Final' }}</span>
      </li>
      <li v-if="!responses?.length" class="px-4 py-3 text-gray-500">Nenhuma resposta ainda.</li>
    </ul>
  </main>
</template>
