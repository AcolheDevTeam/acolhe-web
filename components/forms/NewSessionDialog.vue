<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { createAppointmentSchema } from '~/schemas/appointment'
import type { Patient, Appointment } from '~/types'
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

// patientId trava o paciente (ex.: aberto a partir da ficha do paciente).
const { patientId, appointment } = defineProps<{ patientId?: string, appointment?: Appointment }>()
const emit = defineEmits<{ saved: [appointment: Appointment] }>()

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
const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: toTypedSchema(createAppointmentSchema),
  initialValues: { patientId: patientId ?? appointment?.patientId, durationMinutes: 50, modality: 'in_person' },
})

watch(open, (isOpen) => {
  if (isOpen) resetForm({ values: {
    patientId: patientId ?? appointment?.patientId,
    scheduledFor: appointment?.scheduledFor,
    durationMinutes: appointment?.durationMinutes ?? 50,
    modality: (appointment?.modality as 'in_person' | 'online' | undefined) ?? 'in_person',
  } })
})

const durationOptions = computed(() => [...new Set([15, 30, 45, 50, 60, 75, 90, 120, 180, 240, 480, appointment?.durationMinutes ?? 50])]
  .sort((a, b) => a - b).map(minutes => ({ value: String(minutes), label: `${minutes} minutos` })))
const modalityOptions = [{ value: 'in_person', label: 'Presencial' }, { value: 'online', label: 'Online' }]

const onSubmit = handleSubmit(async (values) => {
  try {
    const { patientId: selectedPatient, ...schedule } = values
    const result = await $fetch<Appointment>(appointment ? `/api/appointments/${appointment.id}` : '/api/appointments', {
      method: appointment ? 'PUT' : 'POST', body: appointment ? schedule : values,
    })
    toast.success(appointment ? 'Sessão reagendada.' : 'Sessão agendada.')
    open.value = false
    resetForm()
    await refreshNuxtData(['appointments-all', `appointments-${selectedPatient}`, `appointment-${result.id}`])
    emit('saved', result)
    if (!appointment) await navigateTo(`/appointments/${result.id}`)
  } catch (error) {
    toast.error(apiErrorMessage(error, {
      403: 'Você não tem permissão para agendar para esta paciente.',
      400: 'Confira a data, a hora, a duração e a modalidade.',
      404: 'Esta paciente ou este agendamento não está disponível para você.',
      409: 'Não foi possível agendar: há conflito de horário ou o atendimento já foi encerrado.',
      default: 'Não foi possível salvar o agendamento agora.',
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
        <DialogTitle class="font-serif text-2xl font-normal">{{ appointment ? 'Reagendar sessão' : 'Agendar sessão' }}</DialogTitle>
        <DialogDescription>
          Escolha a data e o horário. A evolução pode ser registrada depois do atendimento.
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit="onSubmit">
        <FormField v-if="!patientId && !appointment" v-slot="{ value, handleChange }" name="patientId">
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

        <FormField v-slot="{ value, handleChange }" name="scheduledFor">
          <FormItem>
            <FormLabel>Data e hora</FormLabel>
            <FormControl>
              <DateTimePicker
                :model-value="value ?? ''"
                @update:model-value="handleChange"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="durationMinutes">
          <FormItem>
            <FormLabel>Duração</FormLabel>
            <FormControl>
              <CustomDropdown :options="durationOptions" :model-value="String(value ?? 50)"
                search-placeholder="Buscar duração…" @update:model-value="handleChange(Number($event))" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField v-slot="{ value, handleChange }" name="modality">
          <FormItem>
            <FormLabel>Modalidade</FormLabel>
            <FormControl>
              <CustomDropdown :options="modalityOptions" :model-value="value ?? 'in_person'"
                search-placeholder="Buscar modalidade…" @update:model-value="handleChange" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button type="submit" :disabled="isSubmitting">{{ appointment ? 'Salvar novo horário' : 'Agendar sessão' }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
