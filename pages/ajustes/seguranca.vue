<script setup lang="ts">
import { Monitor, Smartphone } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ActiveSession } from '~/schemas/account-settings'
import type { User } from '~/types'
import { describeDevice, sessionMeta } from '~/utils/account-sessions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

const { data: sessions, error: sessionsError, status: sessionsStatus, refresh: refreshSessions } = useActiveSessions()

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

// "Encerrar todas as outras" pede a senha atual num diálogo.
const endOthersOpen = ref(false)
const endOthersPassword = ref('')
const endOthersError = ref('')
function openEndOthers() {
  endOthersPassword.value = ''
  endOthersError.value = ''
  endOthersOpen.value = true
}

async function endOthers() {
  if (ending.value || !endOthersPassword.value) return
  ending.value = 'others'
  endOthersError.value = ''
  try {
    await $fetch('/api/me/sessions/end-others', { method: 'POST', body: { currentPassword: endOthersPassword.value } })
    endOthersOpen.value = false
    endOthersPassword.value = ''
    toast.success('As outras sessões foram encerradas.')
  } catch (err) {
    endOthersError.value = apiErrorMessage(err, {
      400: 'Informe a senha atual.',
      422: 'A senha atual não confere. Confira e tente de novo.',
      429: 'Muitas tentativas com a senha atual. Aguarde 15 minutos e tente de novo.',
      default: 'Não foi possível encerrar as outras sessões agora. Tente novamente em instantes.',
    })
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
      <ChangePasswordForm @changed="refreshSessions()" />
    </Card>

    <Card class="animate-rise flex flex-col gap-2 p-6 [animation-delay:.05s]">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-2">
        <h2 class="text-lg font-semibold">Sessões ativas</h2>
        <Button v-if="hasOthers" variant="outline" size="lg" :disabled="!!ending" @click="openEndOthers">
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

  <Dialog v-model:open="endOthersOpen">
    <DialogContent>
      <form class="flex flex-col gap-5" novalidate @submit.prevent="endOthers">
        <DialogHeader>
          <DialogTitle>Encerrar as outras sessões?</DialogTitle>
          <DialogDescription>Os outros aparelhos vão precisar entrar de novo. Este continua conectado. Para confirmar, digite sua senha atual.</DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-2">
          <Label for="end-others-password">Senha atual</Label>
          <PasswordInput
            id="end-others-password"
            v-model="endOthersPassword"
            autocomplete="current-password"
            :aria-invalid="!!endOthersError || undefined"
            :aria-describedby="endOthersError ? 'end-others-error' : undefined"
            :disabled="ending === 'others'"
          />
          <p v-if="endOthersError" id="end-others-error" class="text-sm text-destructive" role="alert">{{ endOthersError }}</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="endOthersOpen = false">Voltar</Button>
          <Button type="submit" :disabled="!endOthersPassword" :loading="ending === 'others'">Encerrar as outras</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
