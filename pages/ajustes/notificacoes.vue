<script setup lang="ts">
import { Lock } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { NotificationKind, NotificationPreference } from '~/schemas/notification'
import type { NotificationChannel } from '~/utils/notifications'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InlineNotice } from '@/components/ui/inline-notice'
import { SaveStatus } from '@/components/ui/save-status'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })
useHead({ title: 'Ajustes · Notificações' })

// Ajustes › Notificações (protótipo "PrefNotificacoes", ACO-99): matriz evento ×
// canal, salva sozinha a cada interruptor. Só os eventos que a API já gera;
// cancelamento, resumo diário e cobrança ficam de fora até existirem.
// A sub-navegação de Ajustes entra com a ACO-98.
const { data, status, error, refresh } = await useNotificationPreferences()

const rows = ref<NotificationPreference[]>([])
watch(() => data.value?.preferences, (saved) => {
  if (saved?.length) rows.value = preferenceRows(saved)
}, { immediate: true })

// Um envio por vez para cada evento: o último toque é o que fica no servidor.
const queues = new Map<NotificationKind, Promise<unknown>>()
const pending = ref(0)
const failed = ref(false)
const saveState = computed(() => pending.value ? 'saving' : failed.value ? 'error' : 'saved')

function toggle(kind: NotificationKind, channel: NotificationChannel, value: boolean) {
  const before = rows.value.find(p => p.kind === kind)
  if (!before) return
  rows.value = withPreference(rows.value, kind, channel, value)
  const next = rows.value.find(p => p.kind === kind)!
  pending.value++
  failed.value = false
  const run = (queues.get(kind) ?? Promise.resolve()).then(async () => {
    try {
      await $fetch(`/api/notifications/preferences/${kind}`, {
        method: 'PUT',
        body: { inApp: next.inApp, email: next.email },
      })
    }
    catch (err) {
      failed.value = true
      // Volta só o canal que falhou, se ninguém mexeu nele depois.
      const current = rows.value.find(p => p.kind === kind)
      if (current && current[channel] === value) rows.value = withPreference(rows.value, kind, channel, before[channel])
      toast.error(notificationErrorMessage(err, 'save-preference'))
    }
    finally {
      pending.value--
    }
  })
  queues.set(kind, run)
}
</script>

<template>
  <PageHeader eyebrow="Ajustes" title="Notificações">
    <template #actions>
      <SaveStatus v-if="rows.length" :state="saveState" saved-text="Salvo automaticamente" />
    </template>
  </PageHeader>

  <div class="flex w-full max-w-[808px] flex-col gap-6 px-4 pb-14 pt-6 md:px-8 lg:px-12">
    <InlineNotice class="animate-rise flex gap-3 [animation-delay:80ms]">
      <Lock class="mt-0.5 size-[18px] shrink-0" :stroke-width="1.8" aria-hidden="true" />
      <p>Os e-mails avisam que algo aconteceu e trazem um link para o Acolhe. Nunca incluem respostas, anotações ou outro conteúdo clínico.</p>
    </InlineNotice>

    <Card v-if="error && !rows.length" class="animate-fade flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p class="text-[15px] text-muted-foreground">{{ notificationErrorMessage(error, 'preferences') }}</p>
      <Button variant="outline" size="sm" :loading="status === 'pending'" @click="refresh()">Tentar de novo</Button>
    </Card>

    <div v-else-if="!rows.length" class="flex flex-col gap-3">
      <Skeleton v-for="n in 3" :key="n" class="h-16 w-full rounded-2xl" />
    </div>

    <Card v-else role="region" aria-labelledby="t-eventos" class="animate-rise px-4 py-2 [animation-delay:120ms] sm:px-6">
      <div class="grid grid-cols-[minmax(0,1fr)_56px_56px] items-center gap-3 pb-2.5 pt-4 sm:grid-cols-[minmax(220px,1fr)_96px_96px]">
        <h2 id="t-eventos" class="text-lg font-semibold">Avisar quando</h2>
        <span class="label-mono text-center text-[11px]">E-mail</span>
        <span class="label-mono text-center text-[11px]">No app</span>
      </div>
      <div
        v-for="pref in rows"
        :key="pref.kind"
        class="grid grid-cols-[minmax(0,1fr)_56px_56px] items-center gap-3 border-t border-secondary py-4 sm:grid-cols-[minmax(220px,1fr)_96px_96px]"
      >
        <span class="flex flex-col gap-0.5">
          <span :id="`ev-${pref.kind}`" class="text-[15px] font-medium">{{ notificationKindMeta[pref.kind].label }}</span>
          <span class="text-[13px] text-muted-foreground">{{ notificationKindMeta[pref.kind].description }}</span>
        </span>
        <span class="flex justify-center">
          <Switch
            :model-value="pref.email"
            :aria-label="`${notificationKindMeta[pref.kind].label} por e-mail`"
            @update:model-value="(on: boolean) => toggle(pref.kind, 'email', on)"
          />
        </span>
        <span class="flex justify-center">
          <Switch
            :model-value="pref.inApp"
            :aria-label="`${notificationKindMeta[pref.kind].label} no app`"
            @update:model-value="(on: boolean) => toggle(pref.kind, 'inApp', on)"
          />
        </span>
      </div>
    </Card>

    <NuxtLink to="/notificacoes" class="self-start text-sm font-medium text-primary underline-offset-4 hover:underline">
      Ver notificações
    </NuxtLink>
  </div>
</template>
