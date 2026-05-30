<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { createSessionSchema } from '~/schemas/session'

definePageMeta({
  middleware: ['auth', 'psychologist-only'],
})

const route = useRoute()
const router = useRouter()
const patientId = computed(() => (route.query.patient as string) || '')

const { handleSubmit, errors, setFieldValue } = useForm({
  validationSchema: toTypedSchema(createSessionSchema),
})

// patientId vem da query — fixado no formulário.
watchEffect(() => setFieldValue('patientId', patientId.value))

// O input datetime-local entrega "YYYY-MM-DDTHH:mm"; a API exige ISO 8601.
const occurredAtLocal = ref('')
watch(occurredAtLocal, (v) => {
  setFieldValue('occurredAt', v ? new Date(v).toISOString() : '')
})

// Notas clínicas: rascunho local persistido (spec §3.2). Ainda não há endpoint
// na API Go para persistir o prontuário, então as notas ficam só no navegador.
const draft = useClinicalDraftStore()

const submitError = ref('')

const onSubmit = handleSubmit(async (values) => {
  submitError.value = ''
  try {
    await $fetch('/api/sessions', { method: 'POST', body: values })
    draft.$reset() // limpa o rascunho após registrar a sessão
    await router.push(`/patients/${patientId.value}/sessions`)
  } catch {
    submitError.value = 'Não foi possível registrar a sessão.'
  }
})
</script>

<template>
  <main class="mx-auto max-w-2xl p-6">
    <NuxtLink :to="`/patients/${patientId}/sessions`" class="text-sm text-emerald-700">← Sessões</NuxtLink>
    <h1 class="mt-2 text-2xl font-semibold">Nova sessão</h1>

    <p v-if="!patientId" class="mt-4 text-sm text-red-600">
      Paciente não informado. Acesse por <NuxtLink to="/patients" class="underline">Pacientes</NuxtLink>.
    </p>

    <form v-else class="mt-4 flex flex-col gap-4" @submit="onSubmit">
      <label class="flex flex-col gap-1">
        <span class="text-sm">Data e hora</span>
        <input v-model="occurredAtLocal" type="datetime-local" class="rounded border px-3 py-2" />
        <span v-if="errors.occurredAt" class="text-sm text-red-600">{{ errors.occurredAt }}</span>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-sm">Notas clínicas</span>
        <textarea
          v-model="draft.content"
          rows="8"
          class="rounded border px-3 py-2"
          placeholder="Rascunho — salvo localmente neste navegador."
        />
        <span class="text-xs text-gray-500">
          Rascunho local (persistido no navegador). A persistência no servidor depende de um
          endpoint de prontuário na API.
        </span>
      </label>

      <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>

      <button type="submit" class="self-start rounded bg-emerald-600 px-4 py-2 text-white">
        Registrar sessão
      </button>
    </form>
  </main>
</template>
