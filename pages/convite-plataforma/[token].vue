<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { newPasswordSchema } from '~/schemas/password'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const token = computed(() => String(route.params.token ?? ''))
const password = ref('')
const confirmation = ref('')
const submitting = ref(false)
const complete = ref(false)
const errorMessage = ref('')
const passwordError = computed(() => {
  if (!password.value) return ''
  const result = newPasswordSchema.safeParse(password.value)
  return result.success ? '' : result.error.issues[0]?.message ?? ''
})
const confirmationError = computed(() => confirmation.value && confirmation.value !== password.value ? 'As senhas não são iguais.' : '')
const canSubmit = computed(() => !!password.value && !passwordError.value && password.value === confirmation.value)

watch([password, confirmation], () => { errorMessage.value = '' })

async function accept() {
  if (!canSubmit.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/platform-invitations/${encodeURIComponent(token.value)}/accept`, { method: 'POST', body: { password: password.value } })
    complete.value = true
  }
  catch (error) {
    errorMessage.value = apiErrorMessage(error, {
      404: 'Este convite não foi encontrado ou expirou. Peça à equipe Acolhe para enviar outro convite.',
      409: 'Este e-mail já possui uma conta ou este convite já foi utilizado. Tente entrar pela tela de login.',
      400: 'Confira a senha informada e tente novamente.',
      default: 'Não foi possível aceitar o convite agora. Tente novamente em instantes.',
    })
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pb-10 pt-5">
    <header class="flex items-center justify-between pb-8"><AppLogo /><span class="label-mono">Equipe Acolhe</span></header>
    <section v-if="complete" class="flex flex-1 flex-col justify-center gap-5" aria-live="polite">
      <span class="flex size-14 items-center justify-center rounded-full bg-accent text-primary"><Check class="size-6" /></span>
      <h1 class="text-[26px] font-semibold tracking-[-0.025em]">Acesso da plataforma ativado</h1>
      <p class="text-[15px] leading-normal text-secondary-foreground">Sua senha foi definida. Entre com o e-mail que recebeu o convite para acessar o painel.</p>
      <Button size="xl" class="h-[50px] w-full" as-child><NuxtLink to="/login">Ir para o login</NuxtLink></Button>
    </section>
    <form v-else class="my-auto flex flex-col gap-5" @submit.prevent="accept">
      <div><p class="label-mono">Convite de acesso</p><h1 class="mt-2 text-[26px] font-semibold tracking-[-0.025em]">Defina sua senha</h1><p class="mt-2 text-sm leading-6 text-secondary-foreground">Crie uma senha para concluir seu acesso à plataforma Acolhe.</p></div>
      <div class="flex flex-col gap-1.5"><Label for="platform-password">Senha</Label><PasswordInput id="platform-password" v-model="password" autocomplete="new-password" placeholder="Mínimo de 8 caracteres" :aria-invalid="!!passwordError" /> <p v-if="passwordError" class="text-[13px] text-destructive">{{ passwordError }}</p></div>
      <div class="flex flex-col gap-1.5"><Label for="platform-password-confirm">Repita a senha</Label><PasswordInput id="platform-password-confirm" v-model="confirmation" autocomplete="new-password" :aria-invalid="!!confirmationError" /> <p v-if="confirmationError" class="text-[13px] text-destructive">{{ confirmationError }}</p></div>
      <p v-if="errorMessage" class="text-sm text-destructive" role="alert">{{ errorMessage }}</p>
      <Button size="xl" class="h-[50px] w-full" type="submit" :disabled="!canSubmit" :loading="submitting">{{ submitting ? 'Ativando acesso…' : 'Definir senha e aceitar' }}</Button>
      <p class="text-center text-sm text-muted-foreground">Já tem acesso? <NuxtLink class="font-medium text-primary underline-offset-4 hover:underline" to="/login">Entrar</NuxtLink></p>
    </form>
  </main>
</template>
