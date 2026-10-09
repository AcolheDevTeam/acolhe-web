<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { User } from '~/types'
import { signupTermsVersion } from '~/schemas/signup'
import { acceptExistingSchema, acceptNewAccountSchema, type InvitationPreview } from '~/schemas/workspace-invitation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Aceite do convite (ACO-62): conta existente confirma com a senha; conta nova
// segue as mesmas regras do cadastro, com CRP quando o convite inclui atender.
const props = defineProps<{ token: string, preview: InvitationPreview }>()
const submitError = ref('')
const isNew = computed(() => !props.preview.accountExists)
// Nome e CRP: conta nova, ou conta existente que vai passar a atender.
const asksProfile = computed(() => isNew.value || props.preview.needsCrp)

interface AcceptFormValues {
  fullName?: string
  password?: string
  crpNumber?: string
  crpState?: string
  acceptTerms?: boolean
  acceptPrivacy?: boolean
  termsVersion?: string
  privacyVersion?: string
}

// O schema depende do convite (conta nova ou existente, com ou sem CRP).
const schema = props.preview.accountExists ? acceptExistingSchema(props.preview.needsCrp) : acceptNewAccountSchema(props.preview.needsCrp)
const { defineField, errors, handleSubmit, isSubmitting } = useForm<AcceptFormValues>({
  validationSchema: toTypedSchema(schema) as never,
  initialValues: { termsVersion: signupTermsVersion, privacyVersion: signupTermsVersion, acceptTerms: false, acceptPrivacy: false },
})
const [fullName, fullNameAttrs] = defineField('fullName')
const [password, passwordAttrs] = defineField('password')
const [crpNumber, crpNumberAttrs] = defineField('crpNumber')
const [crpState, crpStateAttrs] = defineField('crpState')
const [acceptTerms] = defineField('acceptTerms')
const [acceptPrivacy] = defineField('acceptPrivacy')
const errorFor = (field: string) => (errors.value as Record<string, string | undefined>)[field]

const onSubmit = handleSubmit(async (values) => {
  submitError.value = ''
  const body = props.preview.accountExists
    ? (props.preview.needsCrp
        ? { password: values.password, fullName: values.fullName, crpNumber: values.crpNumber, crpState: values.crpState }
        : { password: values.password })
    : values
  try {
    const user = await $fetch<User>(`/api/workspace-invitations/${props.token}/accept`, { method: 'POST', body })
    clearNuxtData()
    // Página inteira: a sessão nova não reaproveita nada da anterior.
    await navigateTo(homeFor(user), { external: true, replace: true })
  }
  catch (error) {
    submitError.value = invitationErrorMessage(error)
  }
})
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
    <template v-if="asksProfile">
      <div class="flex flex-col gap-1.5">
        <Label for="fullName">Nome completo</Label>
        <Input id="fullName" v-model="fullName" v-bind="fullNameAttrs" autocomplete="name" :aria-invalid="!!errorFor('fullName')" />
        <p v-if="errorFor('fullName')" class="text-xs text-destructive">{{ errorFor('fullName') }}</p>
      </div>
      <div v-if="preview.needsCrp" class="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <div class="flex flex-col gap-1.5">
          <Label for="crpNumber">Número CRP</Label>
          <Input id="crpNumber" v-model="crpNumber" v-bind="crpNumberAttrs" placeholder="123456" inputmode="numeric" :aria-invalid="!!errorFor('crpNumber')" />
          <p v-if="errorFor('crpNumber')" class="text-xs text-destructive">{{ errorFor('crpNumber') }}</p>
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="crpState">Região</Label>
          <Input id="crpState" v-model="crpState" v-bind="crpStateAttrs" placeholder="06" maxlength="2" :aria-invalid="!!errorFor('crpState')" />
          <p v-if="errorFor('crpState')" class="text-xs text-destructive">{{ errorFor('crpState') }}</p>
        </div>
      </div>
    </template>
    <div class="flex flex-col gap-1.5">
      <Label for="password">{{ isNew ? 'Crie uma senha' : 'Sua senha do Acolhe' }}</Label>
      <PasswordInput id="password" v-model="password" v-bind="passwordAttrs" :autocomplete="isNew ? 'new-password' : 'current-password'" :aria-invalid="!!errorFor('password')" />
      <p v-if="errorFor('password')" class="text-xs text-destructive">{{ errorFor('password') }}</p>
    </div>
    <template v-if="isNew">
      <div class="flex items-start gap-3 text-sm">
        <Checkbox id="acceptTerms" class="mt-1" :model-value="acceptTerms === true" @update:model-value="(checked) => (acceptTerms = checked === true)" />
        <Label for="acceptTerms" class="font-normal leading-relaxed">Aceito os Termos de Uso (versão 0.3).</Label>
      </div>
      <p v-if="errorFor('acceptTerms')" class="text-xs text-destructive">{{ errorFor('acceptTerms') }}</p>
      <div class="flex items-start gap-3 text-sm">
        <Checkbox id="acceptPrivacy" class="mt-1" :model-value="acceptPrivacy === true" @update:model-value="(checked) => (acceptPrivacy = checked === true)" />
        <Label for="acceptPrivacy" class="font-normal leading-relaxed">Aceito a Política de Privacidade (versão 0.3).</Label>
      </div>
      <p v-if="errorFor('acceptPrivacy')" class="text-xs text-destructive">{{ errorFor('acceptPrivacy') }}</p>
    </template>
    <p v-if="submitError" class="text-sm text-destructive" role="alert">{{ submitError }}</p>
    <Button type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Aceitando…' : isNew ? 'Criar conta e aceitar' : 'Aceitar convite' }}</Button>
  </form>
</template>
