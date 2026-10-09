<script setup lang="ts">
import { MailCheck } from 'lucide-vue-next'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { passwordResetRequestSchema, passwordResetSentMessage } from '~/schemas/password-reset'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Recuperar senha · Acolhe' })

// A API aceita um envio por minuto por conta; a espera do "Reenviar" segue isso.
const RESEND_WAIT_SECONDS = 60

const { handleSubmit, errors, defineField, isSubmitting, values } = useForm({
  validationSchema: toTypedSchema(passwordResetRequestSchema),
})
const [email, emailAttrs] = defineField('email')
const sent = ref(false)
const resentOnce = ref(false)
const requestError = ref('')
const wait = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

function startWait() {
  clearInterval(timer)
  wait.value = RESEND_WAIT_SECONDS
  timer = setInterval(() => {
    wait.value = Math.max(0, wait.value - 1)
    if (wait.value === 0) clearInterval(timer)
  }, 1000)
}
onBeforeUnmount(() => clearInterval(timer))

async function request(address: string) {
  requestError.value = ''
  try {
    await $fetch('/api/password-reset', { method: 'POST', body: { email: address } })
    return true
  } catch (error) {
    requestError.value = apiErrorMessage(error, {
      400: 'Informe um e-mail válido.',
      default: 'Não foi possível enviar o link agora. Tente novamente em instantes.',
    })
    return false
  }
}

const onSubmit = handleSubmit(async (form) => {
  if (await request(form.email)) {
    sent.value = true
    resentOnce.value = false
    startWait()
  }
})

const resending = ref(false)
async function resend() {
  if (wait.value > 0 || !values.email) return
  resending.value = true
  if (await request(values.email)) {
    resentOnce.value = true
    startWait()
  }
  resending.value = false
}
</script>

<template>
  <AuthShell
    heading="Recuperar acesso à sua conta"
    support="Vale para psicólogas e pacientes. O link de redefinição chega no e-mail cadastrado e expira em 1 hora."
  >
    <form v-if="!sent" class="animate-rise flex flex-col gap-[22px]" novalidate @submit="onSubmit">
      <div class="flex flex-col gap-2.5">
        <p class="label-mono text-xs">Esqueci a senha</p>
        <h1 class="text-[32px] font-semibold leading-[1.15] tracking-[-0.025em]">Qual é o seu e-mail?</h1>
        <p class="text-[15px] leading-normal text-secondary-foreground">Vamos enviar um link para você criar uma senha nova.</p>
      </div>
      <div class="flex flex-col gap-2">
        <Label for="email">E-mail</Label>
        <Input
          id="email"
          v-model="email"
          v-bind="emailAttrs"
          type="email"
          class="h-12"
          autocomplete="email"
          placeholder="voce@exemplo.com"
          :aria-invalid="!!errors.email"
        />
        <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
      </div>
      <p v-if="requestError" class="text-sm text-destructive" role="alert">{{ requestError }}</p>
      <Button type="submit" size="xl" class="w-full" :loading="isSubmitting">{{ isSubmitting ? 'Enviando…' : 'Enviar link' }}</Button>
      <NuxtLink to="/login" class="text-center text-sm text-primary underline-offset-[3px] hover:underline">Voltar para o login</NuxtLink>
    </form>

    <div v-else class="animate-fade flex flex-col gap-[22px]">
      <span aria-hidden="true" class="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <MailCheck class="size-6" :stroke-width="1.8" />
      </span>
      <div class="flex flex-col gap-2.5">
        <h1 class="text-[32px] font-semibold leading-[1.15] tracking-[-0.025em]">Link enviado</h1>
        <p class="text-[15px] leading-relaxed text-secondary-foreground">{{ passwordResetSentMessage }}</p>
      </div>
      <div aria-live="polite" class="flex flex-col gap-2">
        <Button variant="outline" size="xl" class="w-full" :disabled="wait > 0" :loading="resending" @click="resend">
          {{ wait > 0 ? `Reenviar em ${wait} s` : 'Reenviar link' }}
        </Button>
        <p v-if="resentOnce" class="animate-fade text-center text-[13px] text-positive">Enviamos outro link.</p>
        <p v-if="requestError" class="text-center text-sm text-destructive" role="alert">{{ requestError }}</p>
      </div>
      <NuxtLink to="/login" class="text-center text-sm text-primary underline-offset-[3px] hover:underline">Voltar para o login</NuxtLink>
    </div>
  </AuthShell>
</template>
