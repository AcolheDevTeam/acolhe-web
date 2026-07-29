<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { assignActivitySchema } from '~/schemas/activity'
import type { ActivityTemplate, Patient } from '~/types'
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
const { data: templates } = await useFetch<ActivityTemplate[]>('/api/templates', {
  key: 'templates-list',
  default: () => [],
})

const { handleSubmit, isSubmitting, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(assignActivitySchema),
})

watchEffect(() => {
  if (patientId) setFieldValue('patientId', patientId)
})

const dueLocal = ref('')
watch(dueLocal, (v) => setFieldValue('dueAt', v ? new Date(v).toISOString() : undefined))

const onSubmit = handleSubmit(async (values) => {
  try {
    await $fetch('/api/activities', { method: 'POST', body: values })
    toast.success('Atividade atribuída.')
    open.value = false
    resetForm()
    dueLocal.value = ''
    if (patientId) setFieldValue('patientId', patientId)
    await refreshNuxtData(`activities-${values.patientId}`)
    await refreshNuxtData('activities-all')
  } catch {
    toast.error('Não foi possível atribuir a atividade.')
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="font-serif text-2xl font-normal">Atribuir atividade</DialogTitle>
        <DialogDescription>
          Escolha um template da biblioteca e, se quiser, um prazo de resposta.
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="templateId">
          <FormItem>
            <FormLabel>Template</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="t in templates" :key="t.id" :value="t.id">
                    {{ t.title }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

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

        <FormField name="dueAt">
          <FormItem>
            <FormLabel>Prazo <span class="text-muted-foreground">(opcional)</span></FormLabel>
            <FormControl>
              <Input v-model="dueLocal" type="datetime-local" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button type="submit" :disabled="isSubmitting">Atribuir</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
