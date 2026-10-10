<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { clinicSignupFormSchema } from '~/schemas/clinic-signup'
import { signupTermsVersion } from '~/schemas/signup'
import { crpRegions } from '~/utils/signup-steps'
import { Button } from '@/components/ui/button'
import { CheckboxCard } from '@/components/ui/checkbox-card'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '~/types'

definePageMeta({
  layout: 'auth',
  middleware: [
    () => {
      if (!useRuntimeConfig().public.clinicSelfSignupEnabled) return navigateTo('/signup', { replace: true })
    },
  ],
})
useHead({ title: 'Cadastro da clínica · Acolhe' })

const { data: currentUser } = await useFetch<User | null>('/api/me', { key: 'me' })
if (currentUser.value?.emailStatus === 'verified') await navigateTo('/clinica/criar', { replace: true })
if (currentUser.value?.emailStatus === 'pending') await navigateTo('/verify-email', { replace: true })

const submitError = ref('')
const { defineField, errors, handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(clinicSignupFormSchema),
  initialValues: {
    ownerAttends: false,
    acceptTerms: false,
    acceptPrivacy: false,
    termsVersion: signupTermsVersion,
    privacyVersion: signupTermsVersion,
  },
})
const [fullName, fullNameAttrs] = defineField('fullName')
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')
const [clinicName, clinicNameAttrs] = defineField('clinicName')
const [cnpj, cnpjAttrs] = defineField('cnpj')
const [ownerAttends] = defineField('ownerAttends')
const [crpNumber, crpNumberAttrs] = defineField('crpNumber')
const [crpState] = defineField('crpState')
const [acceptTerms] = defineField('acceptTerms')
const [acceptPrivacy] = defineField('acceptPrivacy')
const regionOptions = crpRegions.map(region => ({ value: region.value, label: `${region.value} · ${region.name}`, description: region.uf }))
const signupKindOptions = [
  { value: 'solo', label: 'Atendo sozinha', description: 'Crie seu consultório individual.' },
  { value: 'clinic', label: 'Tenho uma clínica', description: 'Crie um espaço para sua equipe.' },
]
const ownerOptions = [
  { value: 'no', label: 'Só administro', description: 'Você cuida da equipe e da clínica.' },
  { value: 'yes', label: 'Também atendo', description: 'Você administra e atende pacientes.' },
]
const signupKind = ref('clinic')
watch(signupKind, (kind) => { if (kind === 'solo') void navigateTo('/signup') })
const ownerMode = computed({
  get: () => ownerAttends.value ? 'yes' : 'no',
  set: (value: string) => { ownerAttends.value = value === 'yes' },
})

const onSubmit = handleSubmit(async (values) => {
  submitError.value = ''
  const { confirmPassword: _confirmPassword, ...payload } = values
  try {
    const result = await $fetch<{ emailStatus: 'pending' | 'verified', verificationDelivery: 'sent' | 'failed' | 'disabled' }>('/api/signup/clinic', { method: 'POST', body: payload })
    if (result.emailStatus === 'pending') {
      return await navigateTo({ path: '/verify-email', query: result.verificationDelivery === 'sent' ? { clinic: '1' } : { clinic: '1', delivery: 'failed' } })
    }
    const user = await $fetch<User | null>('/api/me')
    clearNuxtData()
    await navigateTo(user ? homeFor(user) : '/login')
  }
  catch (error) {
    submitError.value = apiErrorMessage(error, {
      400: 'Os dados da clínica não foram aceitos. Confira os campos e tente novamente.',
      409: 'Este e-mail ou CNPJ já está em uso. Entre na sua conta ou confira os dados da clínica.',
      default: 'Não foi possível concluir o cadastro agora. Tente novamente.',
    })
  }
})
</script>

<template>
  <AuthTopbarShell width="md">
    <template #aside>
      <p class="text-sm text-secondary-foreground">Já tem conta? <NuxtLink to="/login" class="font-medium text-primary underline-offset-[3px] hover:underline">Entrar</NuxtLink></p>
    </template>

    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-3">
        <RadioCardGroup v-model="signupKind" :options="signupKindOptions" label="Tipo de cadastro" />
        <p class="text-sm font-medium text-secondary-foreground">Qual será sua atuação na clínica?</p>
        <RadioCardGroup v-model="ownerMode" :options="ownerOptions" label="Sua atuação na clínica" />
      </div>

      <form class="flex flex-col gap-5 rounded-[20px] border bg-card px-5 py-6 sm:px-9 sm:py-9" novalidate @submit.prevent="onSubmit">
        <div>
          <h1 class="text-[28px] font-semibold tracking-[-0.025em]">Tenho uma clínica</h1>
          <p class="mt-1.5 text-[15px] text-secondary-foreground">Crie sua conta e informe os dados da clínica. Ela será criada depois que você confirmar seu e-mail.</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2 sm:col-span-2">
            <Label for="clinic-owner-name">Seu nome completo</Label>
            <Input id="clinic-owner-name" v-model="fullName" v-bind="fullNameAttrs" class="h-12" autocomplete="name" :aria-invalid="!!errors.fullName" />
            <p v-if="errors.fullName" class="text-xs text-destructive">{{ errors.fullName }}</p>
          </div>
          <div class="flex flex-col gap-2 sm:col-span-2">
            <Label for="clinic-owner-email">E-mail</Label>
            <Input id="clinic-owner-email" v-model="email" v-bind="emailAttrs" type="email" class="h-12" autocomplete="email" placeholder="voce@exemplo.com" :aria-invalid="!!errors.email" />
            <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="clinic-owner-password">Senha</Label>
            <PasswordInput id="clinic-owner-password" v-model="password" v-bind="passwordAttrs" class="[&_input]:h-12" autocomplete="new-password" placeholder="Mínimo de 8 caracteres" :aria-invalid="!!errors.password" />
            <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="clinic-owner-confirm-password">Confirme a senha</Label>
            <PasswordInput id="clinic-owner-confirm-password" v-model="confirmPassword" v-bind="confirmPasswordAttrs" class="[&_input]:h-12" autocomplete="new-password" :aria-invalid="!!errors.confirmPassword" />
            <p v-if="errors.confirmPassword" class="text-xs text-destructive">{{ errors.confirmPassword }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="clinic-name">Nome da clínica</Label>
            <Input id="clinic-name" v-model="clinicName" v-bind="clinicNameAttrs" class="h-12" placeholder="Clínica Travessia" :aria-invalid="!!errors.clinicName" />
            <p v-if="errors.clinicName" class="text-xs text-destructive">{{ errors.clinicName }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="clinic-cnpj">CNPJ</Label>
            <Input id="clinic-cnpj" v-model="cnpj" v-bind="cnpjAttrs" class="h-12" inputmode="text" autocomplete="off" placeholder="00.000.000/0000-00" :aria-invalid="!!errors.cnpj" />
            <p v-if="errors.cnpj" class="text-xs text-destructive">{{ errors.cnpj }}</p>
          </div>
        </div>

        <div v-if="ownerAttends" class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <Label for="clinic-crp-number">Número do CRP</Label>
            <Input id="clinic-crp-number" v-model="crpNumber" v-bind="crpNumberAttrs" class="h-12" inputmode="numeric" autocomplete="off" placeholder="123456" :aria-invalid="!!errors.crpNumber" />
            <p v-if="errors.crpNumber" class="text-xs text-destructive">{{ errors.crpNumber }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="clinic-crp-state">Região do CRP</Label>
            <CustomDropdown id="clinic-crp-state" :model-value="crpState" :options="regionOptions" search-placeholder="Buscar região ou estado" empty-text="Nenhuma região encontrada." class="h-12 rounded-xl border-input bg-card px-3.5 text-[15px] shadow-none" :aria-invalid="!!errors.crpState" @update:model-value="value => { crpState = value }" />
            <p v-if="errors.crpState" class="text-xs text-destructive">{{ errors.crpState }}</p>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <CheckboxCard id="clinic-accept-terms" :model-value="acceptTerms === true" title="Termos de Uso" description="Obrigatório · versão 0.3" :invalid="!!errors.acceptTerms" @update:model-value="checked => (acceptTerms = checked)" />
          <p v-if="errors.acceptTerms" class="text-xs text-destructive">{{ errors.acceptTerms }}</p>
          <CheckboxCard id="clinic-accept-privacy" :model-value="acceptPrivacy === true" title="Política de Privacidade" description="Obrigatório · versão 0.3 · como tratamos dados de pacientes (LGPD)" :invalid="!!errors.acceptPrivacy" @update:model-value="checked => (acceptPrivacy = checked)" />
          <p v-if="errors.acceptPrivacy" class="text-xs text-destructive">{{ errors.acceptPrivacy }}</p>
        </div>
        <InlineNotice v-if="submitError" tone="danger">{{ submitError }}</InlineNotice>
        <Button type="submit" size="xl" :loading="isSubmitting">Criar conta da clínica</Button>
        <p class="text-center text-sm text-secondary-foreground">Já tem uma conta verificada? <NuxtLink to="/login?redirect=%2Fclinica%2Fcriar" class="font-medium text-primary underline-offset-4 hover:underline">Entrar para criar uma clínica</NuxtLink></p>
      </form>
    </div>
  </AuthTopbarShell>
</template>
