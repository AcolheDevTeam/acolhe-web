<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import type { z } from 'zod'
import { invitationSchema } from '~/schemas/onboarding'
import { newPasswordSchema } from '~/schemas/password'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

// Aceite do convite da paciente (protótipo "Convite"): consentimentos como
// interruptores com etiqueta obrigatório/opcional, senha e as telas finais de
// conta criada e convite recusado. Todos os consentimentos começam desligados:
// o aceite precisa ser um gesto da paciente (LGPD art. 11).
definePageMeta({ layout: 'auth' })

type Invitation = z.infer<typeof invitationSchema>

const route = useRoute()
const token = computed(() => route.params.token as string)
const { data: invitation, status, error, refresh } = await useFetch<Invitation>(
  () => `/api/onboarding/invitations/${encodeURIComponent(token.value)}`,
  { key: () => `invitation-${token.value}` },
)
const loadFailure = computed(() => invitationLoadFailure(error.value?.statusCode))

const selected = ref<string[]>([])
const password = ref('')
const passwordConfirmation = ref('')
const accepting = ref(false)
const declining = ref(false)
const actionError = ref('')
const completed = ref<'accepted' | 'declined'>()

const requiredMissing = computed(() => (invitation.value?.documents ?? [])
  .some(document => document.required && !selected.value.includes(document.id)))
const passwordError = computed(() => {
  if (!password.value) return ''
  const result = newPasswordSchema.safeParse(password.value)
  return result.success ? '' : result.error.issues[0]?.message ?? ''
})
const confirmationError = computed(() => passwordConfirmation.value && passwordConfirmation.value !== password.value
  ? 'As senhas não são iguais.'
  : '')
const canAccept = computed(() => !requiredMissing.value
  && !!password.value && !passwordError.value
  && password.value === passwordConfirmation.value)

const firstName = computed(() => invitation.value?.patientName.split(' ')[0] ?? '')
const psychologistInitials = computed(() => (invitation.value?.psychologistName ?? '')
  .split(' ').filter(Boolean).map(part => part[0]).filter((_, index, all) => index === 0 || index === all.length - 1).join('').toUpperCase())

// Mexer no formulário depois de um erro tira a mensagem antiga da tela.
watch([password, passwordConfirmation], () => { actionError.value = '' })

function toggleDocument(id: string, checked: boolean) {
  actionError.value = ''
  selected.value = checked
    ? [...new Set([...selected.value, id])]
    : selected.value.filter(documentId => documentId !== id)
}

async function accept() {
  if (!canAccept.value) return
  accepting.value = true
  actionError.value = ''
  try {
    await $fetch(`/api/onboarding/invitations/${encodeURIComponent(token.value)}/accept`, {
      method: 'POST',
      body: { password: password.value, acceptedDocumentIds: selected.value },
    })
    completed.value = 'accepted'
  } catch (error) {
    actionError.value = apiErrorMessage(error, {
      400: 'Confira a senha e os consentimentos marcados.',
      404: 'Este convite não foi encontrado. Peça um novo link a sua(seu) psicóloga(o).',
      410: 'Este convite expirou ou foi cancelado. Peça um novo link a sua(seu) psicóloga(o).',
      409: 'Este convite já foi utilizado ou já existe uma conta com este e-mail. Tente entrar pela tela de login.',
      default: 'Não foi possível concluir o aceite agora. Tente novamente em instantes.',
    })
  } finally {
    accepting.value = false
  }
}

// Recusar encerra o link: pede confirmação antes.
const declineConfirmOpen = ref(false)
function onDeclineDecision(confirmed: boolean) {
  declineConfirmOpen.value = false
  if (confirmed) void decline()
}

async function decline() {
  declining.value = true
  actionError.value = ''
  try {
    await $fetch(`/api/onboarding/invitations/${encodeURIComponent(token.value)}/decline`, {
      method: 'POST',
    })
    completed.value = 'declined'
  } catch (error) {
    actionError.value = apiErrorMessage(error, {
      404: 'Este convite não foi encontrado.',
      410: 'Este convite já não estava mais disponível.',
      default: 'Não foi possível registrar a recusa agora.',
    })
  } finally {
    declining.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
    <header class="animate-rise flex items-center justify-between px-5 pb-3 pt-5">
      <AppLogo animated />
      <span class="label-mono">Convite</span>
    </header>

    <main class="flex flex-1 flex-col px-5 pb-10 pt-2">
      <div v-if="status === 'pending'" class="flex flex-col gap-5" aria-label="Carregando o convite">
        <Skeleton class="h-20 rounded-2xl" />
        <Skeleton class="h-8 w-48" />
        <Skeleton class="h-48 rounded-2xl" />
      </div>

      <div v-else-if="error" class="animate-fade flex flex-1 flex-col justify-center gap-4" role="alert">
        <h1 class="text-[26px] font-semibold tracking-[-0.025em]">{{ loadFailure.title }}</h1>
        <p class="text-[15px] leading-normal text-secondary-foreground">{{ loadFailure.message }}</p>
        <Button v-if="loadFailure.canRetry" variant="outline" size="xl" class="w-full" @click="refresh()">Tentar novamente</Button>
      </div>

      <div v-else-if="completed === 'accepted'" class="animate-fade flex flex-1 flex-col justify-center gap-[18px]" aria-live="polite">
        <span aria-hidden="true" class="flex size-16 items-center justify-center rounded-full bg-accent text-primary">
          <Check class="size-7" :stroke-width="2.2" />
        </span>
        <h1 class="text-[26px] font-semibold tracking-[-0.025em]">Conta criada</h1>
        <p class="text-[15px] leading-normal text-secondary-foreground">
          Seu vínculo com {{ invitation?.psychologistName }} está ativo. Entre com o e-mail {{ invitation?.email }} e a senha que você criou.
        </p>
        <Button size="xl" class="h-[50px] w-full" as-child>
          <NuxtLink to="/login">Entrar</NuxtLink>
        </Button>
      </div>

      <div v-else-if="completed === 'declined'" class="animate-fade flex flex-1 flex-col justify-center gap-[18px]" aria-live="polite">
        <h1 class="text-[26px] font-semibold tracking-[-0.025em]">Convite recusado</h1>
        <p class="text-[15px] leading-normal text-secondary-foreground">
          Nenhuma conta foi criada e o vínculo foi encerrado. Se mudar de ideia, peça um novo convite a sua(seu) psicóloga(o).
        </p>
      </div>

      <div v-else-if="invitation" class="flex flex-col gap-5">
        <section class="animate-rise flex items-center gap-3.5 rounded-2xl bg-brand p-4 text-brand-foreground [animation-delay:60ms]">
          <span aria-hidden="true" class="flex size-12 shrink-0 items-center justify-center rounded-full bg-highlight text-base font-semibold text-brand">{{ psychologistInitials }}</span>
          <span class="flex min-w-0 flex-col gap-0.5">
            <span class="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-muted">Convite de</span>
            <span class="text-[17px] font-semibold text-white">{{ invitation.psychologistName }}</span>
            <span class="text-[13px] text-[#C3CAF0]">Psicóloga(o) · CRP {{ invitation.psychologistCrp }}</span>
          </span>
        </section>

        <div class="animate-rise [animation-delay:120ms]">
          <h1 class="text-[26px] font-semibold leading-tight tracking-[-0.025em]">Olá, {{ firstName }}.</h1>
          <p class="mt-2 text-[15px] leading-normal text-secondary-foreground">
            Antes de criar sua conta, veja como seus dados serão tratados.
            Você pode revogar o consentimento a qualquer momento.
          </p>
        </div>

        <section class="animate-rise rounded-2xl border bg-card px-4 py-1 [animation-delay:180ms]" aria-labelledby="t-consentimento">
          <h2 id="t-consentimento" class="label-mono mt-3 font-medium">Consentimento · LGPD</h2>
          <div
            v-for="document in invitation.documents"
            :key="document.id"
            class="flex items-start gap-3.5 border-b border-secondary py-3.5"
          >
            <span class="flex min-w-0 flex-1 flex-col gap-1">
              <span :id="`consent-${document.id}`" class="text-[15px] font-semibold">
                {{ document.title }}
                <span :class="['text-xs font-medium', document.required ? 'text-warning' : 'text-muted-foreground']">{{ document.required ? 'Obrigatório' : 'Opcional' }}</span>
              </span>
              <span :id="`consent-${document.id}-description`" class="whitespace-pre-line text-[13px] leading-normal text-secondary-foreground">{{ document.content }}</span>
            </span>
            <Switch
              size="lg"
              :model-value="selected.includes(document.id)"
              :aria-labelledby="`consent-${document.id}`"
              :aria-describedby="`consent-${document.id}-description`"
              @update:model-value="(checked: boolean) => toggleDocument(document.id, checked)"
            />
          </div>
          <p class="my-3 text-xs leading-normal text-muted-foreground">
            Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade
            (versão 0.3, 12·05·2026). Seu consentimento fica registrado com data, IP e
            versão exata do documento.
          </p>
        </section>

        <section class="animate-rise flex flex-col gap-3 [animation-delay:240ms]" aria-labelledby="t-senha">
          <h2 id="t-senha" class="text-[17px] font-semibold">Crie sua senha</h2>
          <div class="flex flex-col gap-1.5">
            <span class="text-[13px] font-medium">E-mail</span>
            <p class="flex h-12 items-center truncate rounded-lg bg-secondary px-3.5 text-[15px] text-secondary-foreground">{{ invitation.email }}</p>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="password">Senha</Label>
            <PasswordInput id="password" v-model="password" autocomplete="new-password" placeholder="Mínimo de 8 caracteres" :aria-invalid="!!passwordError" :aria-describedby="passwordError ? 'password-error' : undefined" />
            <p v-if="passwordError" id="password-error" class="text-[13px] text-destructive">{{ passwordError }}</p>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="password-confirmation">Repita a senha</Label>
            <PasswordInput id="password-confirmation" v-model="passwordConfirmation" autocomplete="new-password" :aria-invalid="!!confirmationError" :aria-describedby="confirmationError ? 'password-confirmation-error' : undefined" />
            <p v-if="confirmationError" id="password-confirmation-error" class="text-[13px] text-destructive">{{ confirmationError }}</p>
          </div>
        </section>

        <div class="animate-rise flex flex-col gap-2 [animation-delay:300ms]">
          <p v-if="actionError" class="text-sm text-destructive" role="alert">{{ actionError }}</p>
          <Button size="xl" class="h-[50px] w-full" :disabled="!canAccept || declining" :loading="accepting" @click="accept">
            {{ accepting ? 'Criando conta…' : 'Aceitar e criar conta' }}
          </Button>
          <p v-if="requiredMissing" class="animate-fade text-center text-[13px] text-muted-foreground">Para criar a conta, ative os itens obrigatórios.</p>
          <Button variant="ghost" size="xl" class="h-[50px] w-full" :disabled="accepting" :loading="declining" @click="declineConfirmOpen = true">
            {{ declining ? 'Registrando…' : 'Recusar convite' }}
          </Button>
        </div>
      </div>
    </main>
    <ConfirmDialog
      :open="declineConfirmOpen"
      title="Recusar o convite?"
      description="O link deixa de funcionar e nenhuma conta é criada. Para entrar depois, você vai precisar de um novo convite de sua(seu) psicóloga(o)."
      confirm-label="Recusar convite"
      destructive
      @decision="onDeclineDecision"
    />
  </div>
</template>
