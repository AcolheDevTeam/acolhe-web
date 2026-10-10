<script setup lang="ts">
import { Check, CheckCircle2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PASSWORD_MAX_BYTES, PASSWORD_MIN, passwordBytes } from '~/schemas/password-reset'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Nova senha · Acolhe' })

const route = useRoute()
// O token sai da URL assim que capturado: não pode sobrar em histórico,
// favoritos ou cabeçalho Referer.
const token = ref('')
const ready = ref(false)
onMounted(async () => {
  const queryToken = route.query.token
  if (typeof queryToken === 'string' && queryToken !== '') {
    token.value = queryToken
    await navigateTo({ path: route.path, query: {} }, { replace: true })
  }
  ready.value = true
})

const password = ref('')
const saving = ref(false)
const done = ref(false)
const errorMessage = ref('')
// Link inválido ou vencido: o caminho é pedir outro, não tentar de novo.
const linkProblem = ref(false)

// Regra da API (igual à do cadastro). O protótipo pedia também maiúscula e
// número; a API não exige, então a lista mostra só o que vale de verdade.
const tooLong = computed(() => passwordBytes(password.value) > PASSWORD_MAX_BYTES)
const requirements = computed(() => [
  { label: `Pelo menos ${PASSWORD_MIN} caracteres`, ok: password.value.length >= PASSWORD_MIN },
])
const weak = computed(() => password.value.length < PASSWORD_MIN || tooLong.value)

async function save() {
  if (weak.value || saving.value) return
  saving.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/password-reset/confirm', { method: 'POST', body: { token: token.value, password: password.value } })
    password.value = ''
    token.value = ''
    // A sessão deste navegador, se havia, foi encerrada junto com as outras.
    clearNuxtData()
    done.value = true
  } catch (error) {
    const status = apiErrorInfo(error).status
    linkProblem.value = status === 404 || status === 410
    errorMessage.value = apiErrorMessage(error, {
      400: 'A senha precisa ter pelo menos 8 caracteres e no máximo 72 sem acento.',
      404: 'Este link de redefinição não é válido ou já foi usado.',
      410: 'Este link de redefinição expirou. Peça um novo.',
      default: 'Não foi possível trocar a senha agora. Tente novamente em instantes.',
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AuthShell
    heading="Recuperar acesso à sua conta"
    support="Vale para psicólogas(os) e pacientes. O link de redefinição chega no e-mail cadastrado e expira em 1 hora."
  >
    <div v-if="done" class="animate-fade flex flex-col gap-[22px]" aria-live="polite">
      <span aria-hidden="true" class="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
        <CheckCircle2 class="size-6" :stroke-width="1.8" />
      </span>
      <div class="flex flex-col gap-2.5">
        <h1 class="text-[32px] font-semibold leading-[1.15] tracking-[-0.025em]">Senha alterada</h1>
        <p class="text-[15px] leading-relaxed text-secondary-foreground">Por segurança, encerramos as sessões abertas em todos os aparelhos.</p>
      </div>
      <Button size="xl" class="w-full" as-child><NuxtLink to="/login">Entrar com a senha nova</NuxtLink></Button>
    </div>

    <div v-else-if="ready && !token" class="animate-fade flex flex-col gap-[22px]">
      <div class="flex flex-col gap-2.5">
        <h1 class="text-[32px] font-semibold leading-[1.15] tracking-[-0.025em]">Link incompleto</h1>
        <p class="text-[15px] leading-relaxed text-secondary-foreground">Abra o link do e-mail de novo, ou peça um novo link de redefinição.</p>
      </div>
      <Button size="xl" class="w-full" as-child><NuxtLink to="/esqueci-senha">Pedir um novo link</NuxtLink></Button>
    </div>

    <div v-else-if="!ready" class="flex justify-center py-12"><Spinner class="size-5 text-muted-foreground" label="Carregando" /></div>

    <form v-else class="animate-rise flex flex-col gap-[22px]" novalidate @submit.prevent="save">
      <h1 class="text-[32px] font-semibold leading-[1.15] tracking-[-0.025em]">Crie uma senha nova</h1>
      <div class="flex flex-col gap-2">
        <Label for="new-password">Nova senha</Label>
        <PasswordInput
          id="new-password"
          v-model="password"
          autocomplete="new-password"
          aria-describedby="password-requirements"
          :disabled="saving || linkProblem"
        />
      </div>
      <ul id="password-requirements" aria-live="polite" class="flex flex-col gap-2.5">
        <li v-for="item in requirements" :key="item.label" class="flex items-center gap-2.5 text-sm" :class="item.ok ? 'text-positive' : 'text-muted-foreground'">
          <span aria-hidden="true" class="flex size-5 items-center justify-center rounded-full transition-colors" :class="item.ok ? 'bg-primary text-primary-foreground' : 'border-[1.5px] border-input-hover'">
            <Check v-if="item.ok" class="size-3" :stroke-width="3" />
          </span>
          <span>{{ item.label }}</span>
          <span class="sr-only">{{ item.ok ? '(atendido)' : '(pendente)' }}</span>
        </li>
      </ul>
      <p v-if="tooLong" class="text-sm text-destructive">A senha está longa demais. Use até 72 caracteres sem acento.</p>
      <p v-if="errorMessage" class="text-sm text-destructive" role="alert">{{ errorMessage }}</p>
      <Button v-if="linkProblem" size="xl" class="w-full" as-child><NuxtLink to="/esqueci-senha">Pedir um novo link</NuxtLink></Button>
      <Button v-else type="submit" size="xl" class="w-full" :disabled="weak" :loading="saving">{{ saving ? 'Salvando…' : 'Salvar senha' }}</Button>
    </form>
  </AuthShell>
</template>
