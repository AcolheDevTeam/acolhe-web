<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { createPatientSchema } from '~/schemas/patient'
import type { Patient } from '~/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const open = ref(false)

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: toTypedSchema(createPatientSchema),
})

const onSubmit = handleSubmit(async (values) => {
  try {
    const patient = await $fetch<Patient>('/api/patients', { method: 'POST', body: values })
    toast.success('Paciente criado.')
    open.value = false
    resetForm()
    await refreshNuxtData('patients-list')
    if (patient?.id) await navigateTo(`/patients/${patient.id}`)
  } catch {
    toast.error('Não foi possível criar o paciente.')
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
        <DialogTitle class="font-serif text-2xl font-normal">Novo paciente</DialogTitle>
        <DialogDescription>
          Cadastro mínimo. Dados sensíveis (CPF) são armazenados com criptografia column-level.
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="fullName">
          <FormItem>
            <FormLabel>Nome completo</FormLabel>
            <FormControl>
              <Input type="text" placeholder="Ex.: Júlia Andrade" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="birthDate">
          <FormItem>
            <FormLabel>Data de nascimento</FormLabel>
            <FormControl>
              <Input type="date" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="cpf">
          <FormItem>
            <FormLabel>CPF <span class="text-muted-foreground">(opcional)</span></FormLabel>
            <FormControl>
              <Input type="text" inputmode="numeric" placeholder="Somente números" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button type="submit" :disabled="isSubmitting">Criar paciente</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
