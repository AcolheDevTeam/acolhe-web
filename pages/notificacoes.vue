<script setup lang="ts">
import { CheckCheck, SlidersHorizontal } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { AppNotification, NotificationFilter, NotificationPage } from '~/schemas/notification'
import type { User } from '~/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Skeleton } from '@/components/ui/skeleton'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })
useHead({ title: 'Notificações' })

// Caixa de notificações (protótipo "Notificações", ACO-99): Todas/Não lidas,
// agrupada por dia, marcar uma ou todas como lidas. Cada item leva ao recurso.
const { data: me } = useNuxtData<User | null>('me')
const organizationId = me.value?.workspace?.organizationId ?? me.value?.organizationId ?? 'none'
const { count: unread, refresh: refreshCount } = useUnreadNotifications()

const filter = ref<NotificationFilter>('all')
const { data, status, error, refresh } = await useFetch<NotificationPage>('/api/notifications', {
  key: `notifications-${organizationId}`,
  query: { filter },
  default: () => ({ items: [], nextCursor: null }),
})

// Páginas seguintes ("Carregar mais"); voltam a zero quando o filtro muda.
const extra = ref<AppNotification[]>([])
const extraCursor = ref<string | null | undefined>(undefined)
watch(filter, () => {
  extra.value = []
  extraCursor.value = undefined
})
const items = computed(() => [...(data.value?.items ?? []), ...extra.value])
const nextCursor = computed(() => extraCursor.value === undefined ? data.value?.nextCursor ?? null : extraCursor.value)
const groups = computed(() => groupNotificationsByDay(items.value))

const loadingMore = ref(false)
async function loadMore() {
  if (!nextCursor.value) return
  loadingMore.value = true
  try {
    const page = await $fetch<NotificationPage>('/api/notifications', { query: { filter: filter.value, before: nextCursor.value } })
    extra.value = [...extra.value, ...page.items]
    extraCursor.value = page.nextCursor
  }
  catch (err) {
    toast.error(notificationErrorMessage(err, 'load'))
  }
  finally {
    loadingMore.value = false
  }
}

// Marca na tela na hora; no filtro "Não lidas" a linha sai da lista.
function applyRead(ids: Set<string> | 'all') {
  const now = new Date().toISOString()
  const touch = (list: AppNotification[]) => list
    .map(n => (ids === 'all' || ids.has(n.id)) && !n.readAt ? { ...n, readAt: now } : n)
    .filter(n => filter.value === 'all' || !n.readAt)
  if (data.value) data.value = { ...data.value, items: touch(data.value.items) }
  extra.value = touch(extra.value)
}

const marking = ref<string | null>(null)
async function markRead(n: AppNotification, quiet = false) {
  if (n.readAt) return
  marking.value = n.id
  try {
    await $fetch(`/api/notifications/${n.id}/read`, { method: 'POST' })
    applyRead(new Set([n.id]))
    void refreshCount()
  }
  catch (err) {
    if (!quiet) toast.error(notificationErrorMessage(err, 'read'))
  }
  finally {
    marking.value = null
  }
}

const markingAll = ref(false)
async function markAll() {
  markingAll.value = true
  try {
    await $fetch('/api/notifications/read-all', { method: 'POST' })
    applyRead('all')
    void refreshCount()
  }
  catch (err) {
    toast.error(notificationErrorMessage(err, 'read-all'))
  }
  finally {
    markingAll.value = false
  }
}

const filterOptions = computed(() => [
  { value: 'all' as const, label: 'Todas' },
  { value: 'unread' as const, label: unread.value ? `Não lidas · ${unread.value}` : 'Não lidas' },
])
</script>

<template>
  <PageHeader title="Notificações" :description="unreadSummary(unread)">
    <template #actions>
      <Button variant="ghost" class="text-primary" :disabled="unread === 0" :loading="markingAll" @click="markAll">
        <CheckCheck v-if="!markingAll" />
        Marcar todas como lidas
      </Button>
      <Button variant="outline" as-child>
        <NuxtLink to="/ajustes/notificacoes">
          <SlidersHorizontal />
          Preferências
        </NuxtLink>
      </Button>
    </template>
  </PageHeader>

  <div class="flex w-full max-w-[868px] flex-col gap-6 px-4 pb-14 pt-6 md:px-8 lg:px-12">
    <SegmentedControl
      v-model="filter"
      :options="filterOptions"
      label="Filtro"
      class="animate-rise w-full max-w-[280px] self-start [animation-delay:60ms]"
    />

    <Card v-if="error" class="animate-fade flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p class="text-[15px] text-muted-foreground">{{ notificationErrorMessage(error, 'load') }}</p>
      <Button variant="outline" size="sm" :loading="status === 'pending'" @click="refresh()">Tentar de novo</Button>
    </Card>

    <div v-else-if="status === 'pending' && !items.length" class="flex flex-col gap-3">
      <Skeleton v-for="n in 3" :key="n" class="h-[74px] w-full rounded-2xl" />
    </div>

    <EmptyState
      v-else-if="!items.length && filter === 'unread'"
      class="animate-fade"
      title="Nenhuma notificação não lida."
    >
      <template #action>
        <Button variant="ghost" class="text-primary" @click="filter = 'all'">Ver todas</Button>
      </template>
    </EmptyState>

    <EmptyState
      v-else-if="!items.length"
      class="animate-fade"
      title="Nenhuma notificação ainda."
      description="Você recebe um aviso aqui quando uma paciente responde uma atividade, confirma presença ou aceita o convite."
    />

    <template v-else>
      <section
        v-for="group in groups"
        :key="`${filter}-${group.day}`"
        class="animate-fade flex flex-col gap-1.5"
        :aria-label="group.title"
      >
        <h2 class="label-mono mb-1 text-[11px]">{{ group.title }}</h2>
        <Card class="flex flex-col p-1.5">
          <NotificationItem
            v-for="n in group.items"
            :key="n.id"
            :notification="n"
            :marking="marking === n.id"
            @mark-read="markRead(n)"
            @open="markRead(n, true)"
          />
        </Card>
      </section>
      <Button
        v-if="nextCursor"
        variant="outline"
        class="self-center"
        :loading="loadingMore"
        @click="loadMore"
      >
        Carregar mais
      </Button>
    </template>
  </div>
</template>
