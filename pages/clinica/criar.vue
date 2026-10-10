<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { createClinicPayloadSchema } from '~/schemas/clinic-signup'
import { crpRegions } from '~/utils/signup-steps'
import { useWorkspaces } from '~/composables/useWorkspaces'
import { Button } from '@/components/ui/button'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '~/types'

definePageMeta({
  layout: 'auth',
  middleware: [
    () => {
      if (!useRuntimeConfig().public.clinicSelfSignupEnabled) return navigateTo('/dashboard', { replace: true })
    },
    'auth',
  ],
})
useHead({ title: 'Criar clínica · Acolhe' })

const { data: user } = await useFetch<User | null>('/api/me', { key: 'me' })
if (user.value?.role === 'patient') await navigateTo(homeFor(user.value), { replace: true })

const submitError = ref('')
const { defineField, errors, handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(createClinicPayloadSchema),
  initialValues: { ownerAttends: false },
})
const [name, nameAttrs] = defineField('name')
const [cnpj, cnpjAttrs] = defineField('cnpj')
const [ownerAttends] = defineField('ownerAttends')
const [crpNumber, crpNumberAttrs] = defineField('crpNumber')
const [crpState] = defineField('crpState')
const regionOptions = crpRegions.map(region => ({ value: region.value, label: `${region.value} · ${region.name}`, description: region.uf }))
const ownerMode = computed({
  get: () => ownerAttends.value ? 'yes' : 'no',
  set: (value: string) => { ownerAttends.value = value === 'yes' },
})
const ownerOptions = [
  { value: 'no', label: 'Só administro', description: 'Você cuida da equipe e da clínica.' },
  { value: 'yes', label: 'Também atendo', description: 'Você administra e atende pacientes.' },
]
const { switchTo } = useWorkspaces(false)

const onSubmit = handleSubmit(async (values) => {
  submitError.value = ''
  try {
    const result = await $fetch<{ organizationId: string }>('/api/clinics', { method: 'POST', body: values })
    await switchTo(result.organizationId)
  }
  catch (error) {
    submitError.value = apiErrorMessage(error, {
      400: 'Os dados da clínica não foram aceitos. Confira os campos e tente novamente.',
      401: 'Sua sessão expirou. Entre novamente para continuar.',
      403: 'Confirme seu e-mail antes de criar uma clínica.',
      409: 'Este CNPJ já está vinculado a uma clínica.',
      default: 'Não foi possível criar a clínica agora. Tente novamente.',
    })
  }
})
</script>

<template>
  <AuthTopbarShell width="md">
    <template #aside>
      <NuxtLink :to="homeFor(user)" class="text-sm font-medium text-primary underline-offset-4 hover:underline">Voltar ao Acolhe</NuxtLink>
    </template>
    <form class="flex flex-col gap-5 rounded-[20px] border bg-card px-5 py-6 sm:px-9 sm:py-9" novalidate @submit.prevent="onSubmit">
      <div>
        <p class="label-mono text-muted-foreground">NOVO ESPAÇO DE TRABALHO</p>
        <h1 class="mt-2 text-[28px] font-semibold tracking-[-0.025em]">Criar clínica</h1>
        <p class="mt-1.5 text-[15px] text-secondary-foreground">Sua conta continua a mesma. Depois, você poderá alternar entre consultório e clínica.</p>
      </div>
      <div class="flex flex-col gap-2">
        <Label for="existing-clinic-name">Nome da clínica</Label>
        <Input id="existing-clinic-name" v-model="name" v-bind="nameAttrs" class="h-12" placeholder="Clínica Travessia" :aria-invalid="!!errors.name" />
        <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
      </div>
      <div class="flex flex-col gap-2">
        <Label for="existing-clinic-cnpj">CNPJ</Label>
        <Input id="existing-clinic-cnpj" v-model="cnpj" v-bind="cnpjAttrs" class="h-12" inputmode="text" autocomplete="off" placeholder="00.000.000/0000-00" :aria-invalid="!!errors.cnpj" />
        <p v-if="errors.cnpj" class="text-xs text-destructive">{{ errors.cnpj }}</p>
      </div>
      <div class="flex flex-col gap-2">
        <p class="text-sm font-medium">Qual será sua atuação na clínica?</p>
        <RadioCardGroup v-model="ownerMode" :options="ownerOptions" label="Sua atuação na clínica" />
      </div>
      <div v-if="ownerAttends" class="grid gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <Label for="existing-clinic-crp">Número do CRP</Label>
          <Input id="existing-clinic-crp" v-model="crpNumber" v-bind="crpNumberAttrs" class="h-12" inputmode="numeric" autocomplete="off" placeholder="123456" :aria-invalid="!!errors.crpNumber" />
          <p v-if="errors.crpNumber" class="text-xs text-destructive">{{ errors.crpNumber }}</p>
        </div>
        <div class="flex flex-col gap-2">
          <Label for="existing-clinic-crp-state">Região do CRP</Label>
          <CustomDropdown id="existing-clinic-crp-state" :model-value="crpState" :options="regionOptions" search-placeholder="Buscar região ou estado" empty-text="Nenhuma região encontrada." class="h-12 rounded-xl border-input bg-card px-3.5 text-[15px] shadow-none" :aria-invalid="!!errors.crpState" @update:model-value="value => { crpState = value }" />
          <p v-if="errors.crpState" class="text-xs text-destructive">{{ errors.crpState }}</p>
        </div>
      </div>
      <InlineNotice v-if="submitError" tone="danger">{{ submitError }}</InlineNotice>
      <Button type="submit" size="xl" :loading="isSubmitting">Criar clínica</Button>
    </form>
  </AuthTopbarShell>
</template>
