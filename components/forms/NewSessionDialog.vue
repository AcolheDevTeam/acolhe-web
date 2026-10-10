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

const { data: patients, execute: loadPatients, error: patientsError } = await useFetch<Patient[]>('/api/patients', {
  key: 'dialog-patients-list',
  immediate: false,
  default: () => [],
})
watch(open, async (isOpen) => {
  if (!isOpen) return
  if (!patientId && !appointment?.patientId) {
    await loadPatients()
    if (patientsError.value) toast.error(apiErrorMessage(patientsError.value, { default: 'Não foi possível carregar os pacientes. Feche e abra o formulário para tentar novamente.' }))
  }
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

// Duração padrão do perfil (Ajustes › Perfil, ACO-98) como sugestão para
// sessão nova; ao reagendar vale a duração da própria sessão.
const { data: profile, execute: loadProfile } = useProfile({ immediate: false })
const defaultDuration = computed(() => profile.value?.defaultSessionMinutes ?? 50)

watch(open, async (isOpen) => {
  if (!isOpen) return
  if (!appointment && !profile.value) await loadProfile()
  resetForm({ values: {
    patientId: patientId ?? appointment?.patientId,
    scheduledFor: appointment?.scheduledFor,
    durationMinutes: appointment?.durationMinutes ?? defaultDuration.value,
    modality: (appointment?.modality as 'in_person' | 'online' | undefined) ?? 'in_person',
  } })
})

const durationOptions = computed(() => [...new Set([15, 30, 45, 50, 60, 75, 90, 120, 180, 240, 480, appointment?.durationMinutes ?? defaultDuration.value])]
  .sort((a, b) => a - b).map(minutes => ({ value: String(minutes), label: `${minutes} minutos` })))
const modalityOptions = [{ value: 'in_person', label: 'Presencial' }, { value: 'online', label: 'Online' }]

const onSubmit = handleSubmit(async (values) => {
  try {
    const { patientId: selectedPatient, ...schedule } = values
    const result = await $fetch<Appointment>(appointment ? `/api/appointments/${appointment.id}` : '/api/appointments', {
      method: appointment ? 'PUT' : 'POST', body: appointment ? schedule : values,
    })
    toast.success(appointment
      ? result.status === 'confirmed'
        ? 'Sessão reagendada e presença confirmada automaticamente.'
        : 'Sessão reagendada. A presença precisa ser confirmada novamente.'
      : 'Sessão agendada.')
    open.value = false
    resetForm()
    await refreshNuxtData(['appointments-all', `appointments-${selectedPatient}`, `appointment-${result.id}`])
    emit('saved', result)
    if (!appointment) await navigateTo(`/appointments/${result.id}`)
  } catch (error) {
    toast.error(appointmentConflictMessage(error) ?? apiErrorMessage(error, {
      403: 'O vínculo com este(a) paciente ainda não está ativo: o convite precisa ser aceito antes do agendamento.',
      400: 'Confira a data, a hora, a duração e a modalidade.',
      404: 'Este(a) paciente ou este agendamento não está disponível para você.',
      409: 'Não foi possível agendar neste horário: ele conflita com outra sessão da agenda.',
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
                placeholder="Selecione o(a) paciente"
                search-placeholder="Buscar paciente…"
                empty-text="Nenhum(a) paciente encontrado(a)."
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
