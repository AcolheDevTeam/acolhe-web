<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { resendVerificationPayloadSchema } from '~/schemas/verify-email'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '~/types'

definePageMeta({ layout: 'auth' })

const route = useRoute()

// Sessão é opcional aqui: quem clica no link do e-mail pode estar deslogado.
const { data: me } = await useFetch<User | null>('/api/me', { key: 'me' })
const pendingEmail = computed(() => (me.value?.emailStatus === 'pending' ? me.value.email : ''))

// O token sai da URL assim que capturado: ele não pode sobrar em histórico,
// logs de navegação nem analytics (requisito do ACO-63). Vive só nesta ref.
const token = ref('')

// delivery=failed vem do cadastro quando o primeiro envio não saiu (C2: a conta
// existe mesmo assim; o reenvio é a recuperação).
const deliveryFailed = route.query.delivery === 'failed'

type Feedback = ReturnType<typeof verifyEmailFeedback>
const feedback = ref<Feedback | null>(null)
const confirming = ref(false)

async function confirm() {
  if (!token.value) return
  confirming.value = true
  try {
    await $fetch('/api/verify-email', { method: 'POST', body: { token: token.value } })
    feedback.value = verifyEmailConfirmed
    // A projeção do /me em cache ainda diz "pendente"; a próxima tela precisa reler.
    clearNuxtData('me')
  } catch (error) {
    feedback.value = verifyEmailFeedback(apiErrorInfo(error).status)
  } finally {
    confirming.value = false
  }
}

onMounted(async () => {
  const queryToken = route.query.token
  if (typeof queryToken === 'string' && queryToken !== '') {
    token.value = queryToken
    await navigateTo({ path: route.path, query: {} }, { replace: true })
    await confirm()
  }
})

// Reenvio: com sessão pendente o e-mail já é conhecido; sem sessão, pede o campo.
const resendMessage = ref('')
const resendError = ref('')
const resending = ref(false)

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: toTypedSchema(resendVerificationPayloadSchema),
})
const [email, emailAttrs] = defineField('email')

async function requestResend(target: string) {
  resendMessage.value = ''
  resendError.value = ''
  resending.value = true
  try {
    const response = await $fetch<{ message: string }>('/api/verify-email/resend', {
      method: 'POST',
      body: { email: target },
    })
    resendMessage.value = response.message
  } catch (error) {
    resendError.value = apiErrorMessage(error, {
      400: 'Informe um e-mail válido.',
      default: 'Não foi possível reenviar agora. Tente novamente em instantes.',
    })
  } finally {
    resending.value = false
  }
}

const onResendSubmit = handleSubmit((values) => requestResend(values.email))

async function goToPanel() {
  clearNuxtData()
  await navigateTo('/dashboard')
}
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center p-6">
    <Card class="w-full max-w-md">
      <CardHeader class="gap-5">
        <div class="flex items-center justify-between gap-4">
          <AppLogo />
          <NuxtLink to="/login" class="text-sm text-muted-foreground underline underline-offset-4">Entrar</NuxtLink>
        </div>
        <div>
          <p class="label-mono">Cadastro</p>
          <CardTitle class="display-serif mt-2 text-3xl">
            {{ confirming ? 'Confirmando seu e-mail…' : feedback ? feedback.title : 'Confirme seu e-mail' }}
          </CardTitle>
          <CardDescription v-if="!confirming && feedback" class="mt-2">{{ feedback.message }}</CardDescription>
          <CardDescription v-else-if="!confirming && pendingEmail" class="mt-2">
            Enviamos um link de confirmação para <span class="font-medium text-foreground">{{ pendingEmail }}</span>.
            Ele vale por 24 horas. Confira também a caixa de spam.
          </CardDescription>
          <CardDescription v-else-if="!confirming" class="mt-2">
            Use o link que enviamos para o e-mail do seu cadastro. Se ele venceu, peça um novo abaixo.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="flex flex-col gap-5">
        <p v-if="confirming" class="text-sm text-muted-foreground" role="status" aria-live="polite">
          Um instante — estamos validando o seu link.
        </p>

        <p
          v-if="deliveryFailed && !feedback"
          class="border border-dashed p-3 text-sm leading-relaxed text-muted-foreground"
          role="alert"
        >
          Não conseguimos enviar o e-mail de confirmação agora. Sua conta foi criada;
          peça um novo link abaixo quando quiser.
        </p>

        <!-- Confirmado: segue para o próximo passo. -->
        <template v-if="feedback?.state === 'confirmed'">
          <Button v-if="me" class="w-full" @click="goToPanel">Ir para o painel</Button>
          <Button v-else class="w-full" @click="navigateTo('/login')">Entrar na minha conta</Button>
        </template>

        <!-- Falha nossa: o link continua valendo, oferece tentar de novo. -->
        <Button
          v-else-if="feedback?.canRetry && token"
          class="w-full"
          :disabled="confirming"
          @click="confirm"
        >
          Tentar novamente
        </Button>

        <!-- Reenvio: sem sessão pendente, pede o e-mail; com sessão, um clique. -->
        <template v-if="!confirming && feedback?.state !== 'confirmed' && (feedback?.canResend || !feedback)">
          <div v-if="resendMessage" class="border border-dashed p-3 text-sm leading-relaxed" role="status" aria-live="polite">
            {{ resendMessage }}
          </div>
          <template v-else-if="pendingEmail">
            <Button class="w-full" variant="outline" :disabled="resending" @click="requestResend(pendingEmail)">
              {{ resending ? 'Reenviando…' : 'Reenviar e-mail de confirmação' }}
            </Button>
          </template>
          <form v-else class="flex flex-col gap-4" @submit="onResendSubmit">
            <div class="flex flex-col gap-1.5">
              <Label for="resend-email">E-mail do cadastro</Label>
              <Input
                id="resend-email"
                v-model="email"
                v-bind="emailAttrs"
                type="email"
                autocomplete="email"
                :aria-invalid="!!errors.email"
              />
              <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
            </div>
            <Button type="submit" variant="outline" :disabled="resending">
              {{ resending ? 'Reenviando…' : 'Reenviar e-mail de confirmação' }}
            </Button>
          </form>
          <p v-if="resendError" class="text-sm text-destructive" role="alert">{{ resendError }}</p>
        </template>
      </CardContent>
    </Card>
  </main>
</template>
