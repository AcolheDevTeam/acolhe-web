<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { createSessionSchema } from '~/schemas/session'
import type { Patient, Session } from '~/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

// patientId trava o paciente (ex.: aberto a partir da ficha do paciente).
const { patientId } = defineProps<{ patientId?: string }>()

const open = ref(false)

const { data: patients } = await useFetch<Patient[]>('/api/patients', {
  key: 'patients-list',
  default: () => [],
})
const activePatients = computed(() =>
  (patients.value ?? []).filter(patient =>
    patient.status === 'active' && patient.relationshipStatus === 'active'),
)
const patientOptions = computed(() =>
  activePatients.value.map(patient => ({ value: patient.id, label: patient.fullName })),
)
// Sessões são registradas no passado ou agora; o schema rejeita datas futuras.
const todayIso = new Date().toLocaleDateString('sv-SE')

const { handleSubmit, isSubmitting, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(createSessionSchema),
})

watchEffect(() => {
  if (patientId) setFieldValue('patientId', patientId)
})

const onSubmit = handleSubmit(async (values) => {
  try {
    const session = await $fetch<Session>('/api/sessions', { method: 'POST', body: values })
    toast.success('Sessão registrada.')
    open.value = false
    resetForm()
    await refreshNuxtData(`sessions-${values.patientId}`)
    await refreshNuxtData('sessions-all')
    if (session?.id) await navigateTo(`/sessions/${session.id}`)
  } catch (error) {
    toast.error(apiErrorMessage(error, {
      403: 'Esta paciente ainda não aceitou o convite. A sessão só pode ser registrada com o vínculo ativo.',
      400: 'Confira a data, a hora e o texto da evolução.',
      default: 'Não foi possível registrar a sessão agora.',
    }))
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="font-serif text-2xl font-normal">Nova sessão</DialogTitle>
        <DialogDescription>
          Registre apenas o necessário ao cumprimento dos objetivos do trabalho (Art. 5º, II — Res. CFP 01/2009).
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit="onSubmit">
        <FormField v-if="!patientId" v-slot="{ value, handleChange }" name="patientId">
          <FormItem>
            <FormLabel>Paciente</FormLabel>
            <FormControl>
              <CustomDropdown
                :options="patientOptions"
                placeholder="Selecione um paciente"
                search-placeholder="Buscar paciente…"
                empty-text="Nenhum paciente encontrado."
                :model-value="value ?? ''"
                @update:model-value="handleChange"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="occurredAt">
          <FormItem>
            <FormLabel>Data e hora</FormLabel>
            <FormControl>
              <DateTimePicker
                :model-value="value ?? ''"
                :max-date="todayIso"
                @update:model-value="handleChange"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="notes">
          <FormItem>
            <FormLabel>Evolução da sessão</FormLabel>
            <FormControl>
              <Textarea rows="6" placeholder="Registro clínico…" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button type="submit" :disabled="isSubmitting">Registrar sessão</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
