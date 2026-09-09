<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { createPatientSchema } from '~/schemas/patient'
import type { Patient } from '~/types'
import { Check, Copy, Link2, MailCheck, MailWarning } from 'lucide-vue-next'
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
import { DatePicker } from '@/components/ui/date-picker'

const open = ref(false)
const createdPatient = ref<Patient>()
// Nascimento nunca é futuro: o calendário só oferece até hoje.
const todayIso = new Date().toLocaleDateString('sv-SE')
const copied = ref(false)
const delivery = computed(() => invitationDeliveryMeta(createdPatient.value?.invitation?.deliveryStatus))

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: toTypedSchema(createPatientSchema),
})

const onSubmit = handleSubmit(async (values) => {
  try {
    const patient = await $fetch<Patient>('/api/patients', { method: 'POST', body: values })
    createdPatient.value = patient
    toast.success(invitationDeliveryMeta(patient.invitation?.deliveryStatus).toast)
    await refreshNuxtData('patients-list')
  } catch (error) {
    toast.error(apiErrorMessage(error, {
      400: 'Confira o nome, o e-mail e a data de nascimento.',
      403: 'Só psicólogas com perfil ativo podem cadastrar pacientes.',
      default: 'Não foi possível criar o paciente agora.',
    }))
  }
})

async function copyInvitation() {
  const url = createdPatient.value?.invitation?.url
  if (!url) return
  await navigator.clipboard.writeText(url)
  copied.value = true
  toast.success('Link do convite copiado.')
}

watch(open, (isOpen) => {
  if (isOpen) return
  createdPatient.value = undefined
  copied.value = false
  resetForm()
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader v-if="!createdPatient">
        <DialogTitle class="font-serif text-2xl font-normal">Novo paciente</DialogTitle>
        <DialogDescription>
          Cadastre os dados básicos para iniciar o acompanhamento.
        </DialogDescription>
      </DialogHeader>

      <form v-if="!createdPatient" class="flex flex-col gap-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="fullName">
          <FormItem>
            <FormLabel>Nome completo</FormLabel>
            <FormControl>
              <Input type="text" placeholder="Ex.: Júlia Andrade" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl>
              <Input type="email" placeholder="julia@exemplo.com" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="birthDate">
          <FormItem>
            <FormLabel>Data de nascimento</FormLabel>
            <FormControl>
              <DatePicker
                :max-date="todayIso"
                placeholder="Selecione a data de nascimento"
                :model-value="value ?? ''"
                @update:model-value="handleChange"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button type="submit" :disabled="isSubmitting">Criar paciente</Button>
        </DialogFooter>
      </form>

      <div v-else class="flex flex-col gap-5">
        <DialogHeader>
          <div class="mb-1 flex size-10 items-center justify-center rounded-full bg-secondary">
            <MailWarning v-if="delivery.tone === 'warning'" class="size-5" />
            <MailCheck v-else-if="!delivery.showLink" class="size-5" />
            <Link2 v-else class="size-5" />
          </div>
          <DialogTitle class="font-serif text-2xl font-normal">{{ delivery.title }}</DialogTitle>
          <DialogDescription :class="delivery.tone === 'warning' ? 'text-warning' : ''">
            {{ delivery.description(createdPatient.fullName, createdPatient.invitation?.email) }}
          </DialogDescription>
        </DialogHeader>

        <!-- Link em destaque só quando ele é o caminho principal (falha ou envio desabilitado). -->
        <div v-if="delivery.showLink" class="rounded-lg border bg-muted/40 p-3">
          <p class="label-mono mb-2">Link do convite</p>
          <div class="flex gap-2">
            <Input :model-value="createdPatient.invitation?.url" readonly class="min-w-0 text-xs" />
            <Button type="button" variant="outline" size="icon" aria-label="Copiar convite" @click="copyInvitation">
              <Check v-if="copied" />
              <Copy v-else />
            </Button>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">
            Válido até {{ formatDateTime(createdPatient.invitation?.expiresAt) }}.
          </p>
        </div>

        <!-- E-mail enviado: o link fica como ação secundária, sem expor a URL. -->
        <div v-else class="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <p class="text-xs text-muted-foreground">Não recebeu? Você pode enviar o link por outro canal.</p>
          <Button type="button" variant="ghost" size="sm" @click="copyInvitation">
            <Check v-if="copied" />
            <Copy v-else />
            Copiar link
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" @click="open = false">Concluir</Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>
