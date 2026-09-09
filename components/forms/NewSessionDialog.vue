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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const { handleSubmit, isSubmitting, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(createSessionSchema),
})

watchEffect(() => {
  if (patientId) setFieldValue('patientId', patientId)
})

// O input datetime-local devolve horário sem timezone; convertemos para ISO.
const occurredLocal = ref('')
watch(occurredLocal, (v) => setFieldValue('occurredAt', v ? new Date(v).toISOString() : ''))

const onSubmit = handleSubmit(async (values) => {
  try {
    const session = await $fetch<Session>('/api/sessions', { method: 'POST', body: values })
    toast.success('Sessão registrada.')
    open.value = false
    resetForm()
    occurredLocal.value = ''
    await refreshNuxtData(`sessions-${values.patientId}`)
    await refreshNuxtData('sessions-all')
    if (session?.id) await navigateTo(`/sessions/${session.id}`)
  } catch {
    toast.error('Não foi possível registrar a sessão.')
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
        <FormField v-if="!patientId" v-slot="{ componentField }" name="patientId">
          <FormItem>
            <FormLabel>Paciente</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="p in activePatients" :key="p.id" :value="p.id">
                    {{ p.fullName }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="occurredAt">
          <FormItem>
            <FormLabel>Data e hora</FormLabel>
            <FormControl>
              <Input v-model="occurredLocal" type="datetime-local" />
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
