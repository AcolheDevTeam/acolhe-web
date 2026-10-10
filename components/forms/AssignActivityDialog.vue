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
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'

// `templateId` pré-seleciona o template (botão "Enviar" do card da biblioteca).
const { patientId, templateId } = defineProps<{ patientId?: string, templateId?: string }>()

const open = ref(false)

const { data: patients, execute: loadPatients, error: patientsError } = await useFetch<Patient[]>('/api/patients', {
  key: 'dialog-patients-list',
  immediate: false,
  default: () => [],
})
const activePatients = computed(() =>
  (patients.value ?? []).filter(patient =>
    patient.status === 'active' && patient.relationshipStatus === 'active'),
)
const { data: templates, execute: loadTemplates, error: templatesError } = await useFetch<ActivityTemplate[]>('/api/templates', {
  key: 'dialog-templates-list',
  immediate: false,
  default: () => [],
})
watch(open, async (isOpen) => {
  if (!isOpen) return
  await Promise.all([...(patientId ? [] : [loadPatients()]), loadTemplates()])
  if (!open.value) return
  if (!patientId && patientsError.value) toast.error(apiErrorMessage(patientsError.value, { default: 'Não foi possível carregar os pacientes. Feche e abra o formulário para tentar novamente.' }))
  if (templatesError.value) toast.error(apiErrorMessage(templatesError.value, { default: 'Não foi possível carregar os templates. Feche e abra o formulário para tentar novamente.' }))
})

const patientOptions = computed(() =>
  activePatients.value.map(patient => ({ value: patient.id, label: patient.fullName })),
)
const templateOptions = computed(() =>
  (templates.value ?? []).map(template => ({
    value: template.id,
    label: template.title,
    // Versão visível como na tela 13 do design ("v2 · Pessoal").
    description: [`v${template.version}`, templateOriginLabel(template), template.description]
      .filter(Boolean)
      .join(' · '),
  })),
)
// Prazo só faz sentido de hoje em diante.
const todayIso = new Date().toLocaleDateString('sv-SE')

const { handleSubmit, isSubmitting, setFieldValue, resetForm } = useForm({
  validationSchema: toTypedSchema(assignActivitySchema),
})

watchEffect(() => {
  if (patientId) setFieldValue('patientId', patientId)
  if (templateId) setFieldValue('templateId', templateId)
})

const onSubmit = handleSubmit(async (values) => {
  try {
    await $fetch('/api/activities', { method: 'POST', body: values })
    toast.success('Atividade atribuída.')
    open.value = false
    resetForm()
    if (patientId) setFieldValue('patientId', patientId)
    if (templateId) setFieldValue('templateId', templateId)
    await refreshNuxtData(`activities-${values.patientId}`)
    await refreshNuxtData('activities-all')
  } catch (error) {
    toast.error(apiErrorMessage(error, {
      403: 'Este(a) paciente ainda não aceitou o convite. Atividades só podem ser atribuídas com o vínculo ativo.',
      404: 'Template ou paciente não encontrado. Atualize a página e tente de novo.',
      400: 'Confira o template, o(a) paciente e o prazo.',
      default: 'Não foi possível atribuir a atividade agora.',
    }))
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
        <FormField v-slot="{ value, handleChange }" name="templateId">
          <FormItem>
            <FormLabel>Template</FormLabel>
            <FormControl>
              <CustomDropdown
                :options="templateOptions"
                placeholder="Selecione um template"
                search-placeholder="Buscar template…"
                empty-text="Nenhum template encontrado."
                :model-value="value ?? ''"
                @update:model-value="handleChange"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-if="!patientId" v-slot="{ value, handleChange }" name="patientId">
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

        <FormField v-slot="{ value, handleChange }" name="dueAt">
          <FormItem>
            <FormLabel>Prazo <span class="text-muted-foreground">(opcional)</span></FormLabel>
            <FormControl>
              <DateTimePicker
                :model-value="value ?? ''"
                :min-date="todayIso"
                @update:model-value="(v) => handleChange(v || undefined)"
              />
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
