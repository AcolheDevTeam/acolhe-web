<script setup lang="ts">
import { AlertCircle, Check, Clock, Link2Off, Mail } from 'lucide-vue-next'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { resendVerificationPayloadSchema } from '~/schemas/verify-email'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '~/types'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Confirmar e-mail · Acolhe' })

// O protótipo trava o "Reenviar" por 30 s depois de cada envio.
const RESEND_WAIT_SECONDS = 30

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

// Ícone e cores de cada estado, como no protótipo: índigo claro para
// aguardando/confirmado, aviso para link vencido, inválido ou falha nossa.
const stateIcon = computed(() => {
  switch (feedback.value?.state) {
    case 'confirmed': return { icon: Check, warn: false }
    case 'expired': return { icon: Clock, warn: true }
    case 'invalid': return { icon: Link2Off, warn: true }
    case 'unavailable': return { icon: AlertCircle, warn: true }
    default: return { icon: Mail, warn: false }
  }
})

const statusAnnouncement = computed(() => {
  if (confirming.value) return 'Confirmando seu e-mail…'
  return feedback.value ? `${feedback.value.title}. ${feedback.value.message}` : ''
})

// Reenvio: com sessão pendente o e-mail já é conhecido; sem sessão, pede o campo.
const resendMessage = ref('')
const resendError = ref('')
const resending = ref(false)
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

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: toTypedSchema(resendVerificationPayloadSchema),
})
const [email, emailAttrs] = defineField('email')

async function requestResend(target: string) {
  if (wait.value > 0) return
  resendMessage.value = ''
  resendError.value = ''
  resending.value = true
  try {
    const response = await $fetch<{ message: string }>('/api/verify-email/resend', {
      method: 'POST',
      body: { email: target },
    })
    resendMessage.value = response.message
    startWait()
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

// Link vencido ou inválido: o reenvio vira a ação principal da tela.
const resendIsPrimary = computed(() => feedback.value?.state === 'expired' || feedback.value?.state === 'invalid')
const showResend = computed(() => !confirming.value && feedback.value?.state !== 'confirmed' && (feedback.value?.canResend || !feedback.value))
const resendLabel = computed(() => {
  if (resending.value) return 'Reenviando…'
  if (wait.value > 0) return `Reenviar em ${wait.value} s`
  return resendIsPrimary.value ? 'Enviar novo link' : 'Reenviar e-mail'
})

async function goToPanel() {
  clearNuxtData()
  await navigateTo('/dashboard')
}
</script>

<template>
  <AuthTopbarShell width="md" center>
    <template #aside>
      <NuxtLink v-if="!me" to="/login" class="text-sm font-medium text-primary underline-offset-[3px] hover:underline">Entrar</NuxtLink>
    </template>

    <div class="animate-rise flex flex-col items-center gap-5 rounded-[20px] border bg-card px-6 py-8 text-center sm:p-10 [@media(max-height:700px)]:gap-4 [@media(max-height:700px)]:py-6">
      <!-- Região viva estável e só com a mensagem de estado: o bloco abaixo
           remonta a cada troca de estado, e montar já anunciando não é confiável. -->
      <p class="sr-only" aria-live="polite">{{ statusAnnouncement }}</p>
      <!-- Confirmando: só o spinner e o título. -->
      <div v-if="confirming" class="animate-fade flex flex-col items-center gap-[18px] py-6">
        <Spinner class="size-11 border-[3px] border-accent border-t-primary" />
        <h1 class="text-2xl font-semibold tracking-[-0.02em]">Confirmando seu e-mail…</h1>
      </div>

      <div v-else :key="feedback?.state ?? 'pending'" class="animate-fade flex w-full flex-col items-center gap-[18px] [@media(max-height:700px)]:gap-3.5">
        <span
          aria-hidden="true"
          class="flex size-[72px] shrink-0 items-center [@media(max-height:700px)]:size-14 justify-center rounded-full"
          :class="stateIcon.warn ? 'bg-warning-soft text-warning' : 'bg-accent text-primary'"
        >
          <component :is="stateIcon.icon" class="size-8" :stroke-width="feedback?.state === 'confirmed' ? 2.4 : 1.7" />
        </span>

        <div class="flex flex-col items-center gap-[18px] [@media(max-height:700px)]:gap-2.5">
          <h1 class="text-[28px] font-semibold leading-tight tracking-[-0.025em]">{{ feedback ? feedback.title : 'Confira seu e-mail' }}</h1>

          <p v-if="feedback" class="text-[15px] leading-relaxed text-secondary-foreground">{{ feedback.message }}</p>
          <p v-else-if="pendingEmail" class="text-[15px] leading-relaxed text-secondary-foreground">
            Enviamos um link de confirmação para <strong class="font-semibold text-foreground">{{ pendingEmail }}</strong>.
            O link vale por 24 horas. Confira também a caixa de spam.
          </p>
          <p v-else class="text-[15px] leading-relaxed text-secondary-foreground">
            Use o link que enviamos para o e-mail do seu cadastro. Ele vale por 24 horas. Se venceu, peça um novo abaixo.
          </p>
        </div>

        <InlineNotice v-if="deliveryFailed && !feedback" tone="warning" class="w-full text-left">
          Não conseguimos enviar o e-mail de confirmação agora. Sua conta foi criada;
          peça um novo link abaixo quando quiser.
        </InlineNotice>

        <!-- Confirmado: segue para o próximo passo. -->
        <template v-if="feedback?.state === 'confirmed'">
          <Button v-if="me" size="xl" @click="goToPanel">Continuar</Button>
          <Button v-else size="xl" @click="navigateTo('/login')">Entrar na minha conta</Button>
        </template>

        <!-- Falha nossa: o link continua valendo, oferece tentar de novo. -->
        <Button v-else-if="feedback?.canRetry && token" size="xl" :loading="confirming" @click="confirm">
          Tentar novamente
        </Button>

        <!-- Reenvio: sem sessão pendente, pede o e-mail; com sessão, um clique. -->
        <template v-if="showResend">
          <div v-if="pendingEmail" class="flex flex-wrap justify-center gap-2.5">
            <Button
              size="xl"
              :variant="resendIsPrimary ? 'default' : 'outline'"
              :loading="resending"
              :disabled="wait > 0"
              @click="requestResend(pendingEmail)"
            >
              {{ resendLabel }}
            </Button>
          </div>
          <form v-else class="flex w-full flex-col gap-4 text-left" novalidate @submit="onResendSubmit">
            <div class="flex flex-col gap-2">
              <Label for="resend-email">E-mail do cadastro</Label>
              <Input
                id="resend-email"
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
            <Button type="submit" size="xl" :variant="resendIsPrimary ? 'default' : 'outline'" :loading="resending" :disabled="wait > 0">
              {{ resendLabel }}
            </Button>
          </form>
          <InlineNotice v-if="resendMessage" tone="positive" class="w-full text-left">{{ resendMessage }}</InlineNotice>
          <p v-if="resendError" class="text-sm text-destructive" role="alert">{{ resendError }}</p>
        </template>
      </div>
    </div>
  </AuthTopbarShell>
</template>
