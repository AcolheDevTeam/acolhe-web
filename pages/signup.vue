<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { signupSchema, signupTermsVersion } from '~/schemas/signup'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: 'auth' })

const steps = ['Conta', 'CRP', 'Perfil', 'Termos']
const step = ref(0)
const submitError = ref('')

const { defineField, errors, handleSubmit, isSubmitting, validateField } = useForm({
  validationSchema: toTypedSchema(signupSchema),
  initialValues: { termsVersion: signupTermsVersion, privacyVersion: signupTermsVersion, acceptTerms: false, acceptPrivacy: false },
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')
const [fullName, fullNameAttrs] = defineField('fullName')
const [crpNumber, crpNumberAttrs] = defineField('crpNumber')
const [crpState, crpStateAttrs] = defineField('crpState')
const [cpf, cpfAttrs] = defineField('cpf')
const [approach, approachAttrs] = defineField('approach')
const [acceptTerms, acceptTermsAttrs] = defineField('acceptTerms')
const [acceptPrivacy, acceptPrivacyAttrs] = defineField('acceptPrivacy')

const fieldsByStep = [
  ['email', 'password', 'confirmPassword'],
  ['crpNumber', 'crpState', 'cpf'],
  ['fullName', 'approach'],
  ['acceptTerms', 'acceptPrivacy'],
] as const

async function nextStep() {
  const results = await Promise.all(fieldsByStep[step.value].map((field) => validateField(field)))
  if (results.every((result) => result.valid)) step.value++
}

function previousStep() {
  step.value--
  submitError.value = ''
}

const onSubmit = handleSubmit(async (values) => {
  submitError.value = ''
  const { confirmPassword: _confirmPassword, ...apiPayload } = values
  try {
    await $fetch('/api/signup', { method: 'POST', body: apiPayload })
    await navigateTo('/dashboard')
  } catch (error: unknown) {
    const status = (error as { statusCode?: number }).statusCode
    submitError.value = status === 409
      ? 'Não foi possível concluir o cadastro. Confira os dados e tente novamente.'
      : 'Não foi possível concluir o cadastro agora. Tente novamente.'
  }
})
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center p-6">
    <Card class="w-full max-w-2xl">
      <CardHeader class="gap-5">
        <div class="flex items-center justify-between gap-4">
          <AppLogo />
          <NuxtLink to="/login" class="text-sm text-muted-foreground underline underline-offset-4">Já tem conta? Entrar</NuxtLink>
        </div>
        <div>
          <p class="label-mono">Onboarding</p>
          <CardTitle class="display-serif mt-2 text-3xl">Cadastro do psicólogo</CardTitle>
          <CardDescription class="mt-2">Validamos o CRP manualmente em até 24h úteis.</CardDescription>
        </div>
        <ol class="grid grid-cols-4 gap-2" aria-label="Etapas do cadastro">
          <li v-for="(label, index) in steps" :key="label" class="border-t pt-2 text-xs" :class="index <= step ? 'border-foreground text-foreground' : 'text-muted-foreground'">
            <span class="font-mono">0{{ index + 1 }}</span> {{ label }}
          </li>
        </ol>
      </CardHeader>

      <CardContent>
        <form class="flex flex-col gap-5" @submit.prevent="step === steps.length - 1 ? onSubmit() : nextStep()">
          <fieldset v-if="step === 0" class="flex flex-col gap-4">
            <legend class="display-serif text-2xl">Comece pela sua conta</legend>
            <div class="flex flex-col gap-1.5">
              <Label for="email">E-mail</Label>
              <Input id="email" v-model="email" v-bind="emailAttrs" type="email" autocomplete="email" :aria-invalid="!!errors.email" />
              <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="password">Senha</Label>
              <Input id="password" v-model="password" v-bind="passwordAttrs" type="password" autocomplete="new-password" :aria-invalid="!!errors.password" />
              <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="confirmPassword">Confirme sua senha</Label>
              <Input id="confirmPassword" v-model="confirmPassword" v-bind="confirmPasswordAttrs" type="password" autocomplete="new-password" :aria-invalid="!!errors.confirmPassword" />
              <p v-if="errors.confirmPassword" class="text-xs text-destructive">{{ errors.confirmPassword }}</p>
            </div>
          </fieldset>

          <fieldset v-else-if="step === 1" class="flex flex-col gap-4">
            <legend class="display-serif text-2xl">Sobre seu registro profissional</legend>
            <p class="text-sm leading-relaxed text-muted-foreground">O CRP começa como pendente e passa por validação manual.</p>
            <div class="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <div class="flex flex-col gap-1.5"><Label for="crpNumber">Número CRP</Label><Input id="crpNumber" v-model="crpNumber" v-bind="crpNumberAttrs" placeholder="123456" inputmode="numeric" /><p v-if="errors.crpNumber" class="text-xs text-destructive">{{ errors.crpNumber }}</p></div>
              <div class="flex flex-col gap-1.5"><Label for="crpState">Região</Label><Input id="crpState" v-model="crpState" v-bind="crpStateAttrs" placeholder="06" maxlength="2" /><p v-if="errors.crpState" class="text-xs text-destructive">{{ errors.crpState }}</p></div>
            </div>
            <div class="flex flex-col gap-1.5"><Label for="cpf">CPF <span class="text-muted-foreground">(opcional)</span></Label><Input id="cpf" v-model="cpf" v-bind="cpfAttrs" placeholder="•••.•••.•••-••" inputmode="numeric" autocomplete="off" /><p v-if="errors.cpf" class="text-xs text-destructive">{{ errors.cpf }}</p></div>
            <p class="border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">Comprovante CRP: upload indisponível nesta etapa. O arquivo não é aceito, enviado nem armazenado até existir um fluxo privado com varredura, limite e expiração.</p>
          </fieldset>

          <fieldset v-else-if="step === 2" class="flex flex-col gap-4">
            <legend class="display-serif text-2xl">Seu perfil profissional</legend>
            <div class="flex flex-col gap-1.5"><Label for="fullName">Nome completo</Label><Input id="fullName" v-model="fullName" v-bind="fullNameAttrs" autocomplete="name" /><p v-if="errors.fullName" class="text-xs text-destructive">{{ errors.fullName }}</p></div>
            <div class="flex flex-col gap-1.5"><Label for="approach">Abordagem principal <span class="text-muted-foreground">(opcional)</span></Label><Input id="approach" v-model="approach" v-bind="approachAttrs" placeholder="Ex.: TCC, Psicanálise" /></div>
          </fieldset>

          <fieldset v-else class="flex flex-col gap-4">
            <legend class="display-serif text-2xl">Leia com calma</legend>
            <p class="text-sm leading-relaxed text-muted-foreground">Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade (versão 0.3). Seu consentimento fica registrado com data, IP e versão exata do documento.</p>
            <label class="flex items-start gap-3 text-sm"><input v-model="acceptTerms" v-bind="acceptTermsAttrs" type="checkbox" class="mt-1 rounded border-input" /><span>Aceito os Termos de Uso (versão 0.3).</span></label>
            <p v-if="errors.acceptTerms" class="text-xs text-destructive">{{ errors.acceptTerms }}</p>
            <label class="flex items-start gap-3 text-sm"><input v-model="acceptPrivacy" v-bind="acceptPrivacyAttrs" type="checkbox" class="mt-1 rounded border-input" /><span>Aceito a Política de Privacidade (versão 0.3).</span></label>
            <p v-if="errors.acceptPrivacy" class="text-xs text-destructive">{{ errors.acceptPrivacy }}</p>
            <p v-if="submitError" class="text-sm text-destructive" role="alert">{{ submitError }}</p>
          </fieldset>

          <div class="flex justify-between gap-3 border-t pt-5">
            <Button v-if="step > 0" type="button" variant="outline" :disabled="isSubmitting" @click="previousStep">Voltar</Button><span v-else />
            <Button type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Enviando…' : step === steps.length - 1 ? 'Aceitar e criar minha conta' : 'Continuar' }}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
