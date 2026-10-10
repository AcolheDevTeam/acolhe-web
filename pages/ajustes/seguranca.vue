<script setup lang="ts">
import { Check, Monitor, Smartphone } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ActiveSession } from '~/schemas/account-settings'
import type { User } from '~/types'
import { PASSWORD_MAX_BYTES, PASSWORD_MIN, passwordBytes, passwordTooLongMessage } from '~/schemas/password'
import { describeDevice, sessionMeta } from '~/utils/account-sessions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

// Ajustes › Segurança (protótipo "Segurança", ACO-98): troca de senha e
// sessões ativas. Verificação em duas etapas e saída por inatividade ainda não
// existem e ficam fora da tela.
definePageMeta({
  middleware: ['auth', () => {
    const { data: user } = useNuxtData<User | null>('me')
    if (user.value?.role === 'patient') return navigateTo(homeFor(user.value))
  }],
})
useHead({ title: 'Segurança · Ajustes · Acolhe' })

// Troca de senha. A regra é a da API (igual à do cadastro): o protótipo pedia
// também maiúscula e número, que a API não exige.
const current = ref('')
const next = ref('')
const confirm = ref('')
const changing = ref(false)
const passwordDone = ref(false)
const passwordError = ref('')

const tooLong = computed(() => passwordBytes(next.value) > PASSWORD_MAX_BYTES)
const requirements = computed(() => [
  { label: `Pelo menos ${PASSWORD_MIN} caracteres`, ok: next.value.length >= PASSWORD_MIN },
  { label: 'As duas senhas iguais', ok: next.value.length > 0 && next.value === confirm.value },
])
const canChange = computed(() => current.value.length > 0 && !tooLong.value && requirements.value.every(r => r.ok))

watch([current, next, confirm], () => {
  passwordDone.value = false
  passwordError.value = ''
})

const { data: sessions, error: sessionsError, status: sessionsStatus, refresh: refreshSessions } = useActiveSessions()

async function changePassword() {
  if (!canChange.value || changing.value) return
  changing.value = true
  passwordError.value = ''
  try {
    await $fetch('/api/me/password', { method: 'POST', body: { currentPassword: current.value, newPassword: next.value } })
    current.value = ''
    next.value = ''
    confirm.value = ''
    await nextTick()
    passwordDone.value = true
    void refreshSessions()
  } catch (err) {
    passwordError.value = apiErrorMessage(err, {
      400: 'A nova senha precisa ter pelo menos 8 caracteres e no máximo 72 sem acento.',
      409: 'A nova senha precisa ser diferente da atual.',
      422: 'A senha atual não confere. Confira e tente de novo.',
      429: 'Muitas tentativas com a senha atual. Aguarde 15 minutos e tente de novo.',
      default: 'Não foi possível trocar a senha agora. Tente novamente em instantes.',
    })
  } finally {
    changing.value = false
  }
}

// Sessões ativas.
const now = ref(new Date())
const rows = computed(() => (sessions.value ?? []).map((session: ActiveSession) => {
  const device = describeDevice(session.userAgent)
  return { ...session, device: device.label, kind: device.kind, meta: sessionMeta(session, now.value) }
}))
const hasOthers = computed(() => rows.value.some(row => !row.current))
const ending = ref<string | null>(null)

async function endSession(id: string) {
  if (ending.value) return
  ending.value = id
  try {
    await $fetch(`/api/me/sessions/${id}`, { method: 'DELETE' })
    toast.success('Sessão encerrada.')
  } catch (err) {
    toast.error(apiErrorMessage(err, {
      404: 'Esta sessão já tinha sido encerrada.',
      409: 'Esta é a sessão deste aparelho. Para sair dela, use Sair no menu.',
      default: 'Não foi possível encerrar a sessão agora. Tente novamente em instantes.',
    }))
  } finally {
    ending.value = null
    now.value = new Date()
    void refreshSessions()
  }
}

async function endOthers() {
  if (ending.value) return
  ending.value = 'others'
  try {
    await $fetch('/api/me/sessions/end-others', { method: 'POST' })
    toast.success('As outras sessões foram encerradas.')
  } catch (err) {
    toast.error(apiErrorMessage(err, {
      default: 'Não foi possível encerrar as outras sessões agora. Tente novamente em instantes.',
    }))
  } finally {
    ending.value = null
    now.value = new Date()
    void refreshSessions()
  }
}
</script>

<template>
  <SettingsShell title="Segurança">
    <Card class="animate-rise flex flex-col gap-5 p-6">
      <h2 class="text-lg font-semibold">Trocar senha</h2>
      <form class="flex flex-col gap-5" novalidate @submit.prevent="changePassword">
        <div class="flex flex-col gap-2 sm:max-w-[calc(50%-8px)]">
          <Label for="current-password">Senha atual</Label>
          <PasswordInput id="current-password" v-model="current" autocomplete="current-password" :disabled="changing" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <Label for="new-password">Nova senha</Label>
            <PasswordInput id="new-password" v-model="next" autocomplete="new-password" aria-describedby="password-requirements" :disabled="changing" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="confirm-password">Confirmar nova senha</Label>
            <PasswordInput id="confirm-password" v-model="confirm" autocomplete="new-password" :disabled="changing" />
          </div>
        </div>
        <ul id="password-requirements" class="flex flex-wrap gap-x-5 gap-y-2.5">
          <li v-for="item in requirements" :key="item.label" class="flex items-center gap-2.5 text-sm" :class="item.ok ? 'text-positive' : 'text-muted-foreground'">
            <span aria-hidden="true" class="flex size-5 items-center justify-center rounded-full transition-colors" :class="item.ok ? 'bg-primary text-primary-foreground' : 'border-[1.5px] border-input-hover'">
              <Check v-if="item.ok" class="size-3" :stroke-width="3" />
            </span>
            <span>{{ item.label }}</span>
            <span class="sr-only">{{ item.ok ? '(atendido)' : '(pendente)' }}</span>
          </li>
        </ul>
        <p v-if="tooLong" class="text-sm text-destructive">{{ passwordTooLongMessage }}</p>
        <p v-if="passwordError" class="text-sm text-destructive" role="alert">{{ passwordError }}</p>
        <div class="flex flex-wrap items-center gap-4" aria-live="polite">
          <Button type="submit" size="lg" :disabled="!canChange" :loading="changing">{{ changing ? 'Atualizando…' : 'Atualizar senha' }}</Button>
          <span v-if="passwordDone" class="animate-fade text-sm font-medium text-positive">Senha atualizada. As outras sessões foram encerradas.</span>
        </div>
      </form>
    </Card>

    <Card class="animate-rise flex flex-col gap-2 p-6 [animation-delay:.05s]">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-2">
        <h2 class="text-lg font-semibold">Sessões ativas</h2>
        <Button v-if="hasOthers" variant="outline" size="lg" :loading="ending === 'others'" :disabled="!!ending" @click="endOthers">
          Encerrar todas as outras
        </Button>
      </div>

      <div v-if="sessionsStatus === 'pending' && !rows.length" class="flex flex-col gap-3" aria-busy="true">
        <Skeleton class="h-14 rounded-xl" />
        <Skeleton class="h-14 rounded-xl" />
      </div>
      <div v-else-if="sessionsError" class="flex flex-col items-start gap-3 text-sm" role="alert">
        <p>{{ apiErrorMessage(sessionsError, { default: 'Não foi possível carregar as sessões agora.' }) }}</p>
        <Button variant="outline" @click="refreshSessions()">Tentar de novo</Button>
      </div>
      <p v-else-if="!rows.length" class="rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
        Nenhuma sessão registrada ainda. As sessões aparecem aqui a partir do próximo login.
      </p>
      <ul v-else class="flex flex-col">
        <li
          v-for="row in rows"
          :key="row.id"
          class="flex flex-wrap items-center gap-4 border-t border-surface-hover py-3.5"
        >
          <span aria-hidden="true" class="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-subtle text-secondary-foreground">
            <Smartphone v-if="row.kind === 'phone'" class="size-[18px]" :stroke-width="1.8" />
            <Monitor v-else class="size-[18px]" :stroke-width="1.8" />
          </span>
          <span class="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
            <span class="truncate text-[15px] font-medium">{{ row.device }}</span>
            <span class="text-[13px] text-muted-foreground">{{ row.meta }}</span>
          </span>
          <Badge v-if="row.current">Este dispositivo</Badge>
          <Button
            v-else
            variant="outline"
            :aria-label="`Encerrar sessão de ${row.device}`"
            :loading="ending === row.id"
            :disabled="!!ending"
            @click="endSession(row.id)"
          >
            Encerrar
          </Button>
        </li>
      </ul>
    </Card>
  </SettingsShell>
</template>
