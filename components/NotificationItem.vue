<script setup lang="ts">
import { CalendarDays, Check, PenLine, UserRound } from 'lucide-vue-next'
import type { AppNotification } from '~/schemas/notification'
import { Button } from '@/components/ui/button'

// Uma linha da caixa (protótipo "Notificações"): ícone do tipo, "Paciente fez
// tal coisa" como link para o recurso, tipo e hora, e o marcar como lida.
const props = defineProps<{ notification: AppNotification, marking?: boolean }>()
const emit = defineEmits<{ open: [], markRead: [] }>()

const unread = computed(() => !props.notification.readAt)
const meta = computed(() => notificationKindMeta[props.notification.kind])
const who = computed(() => notificationWho(props.notification))
const icon = computed(() => ({
  activity_submitted: PenLine,
  appointment_confirmed: CalendarDays,
  invitation_accepted: UserRound,
})[props.notification.kind])
</script>

<template>
  <article
    :class="[
      'flex items-start gap-3.5 rounded-[14px] p-4 transition-[background-color,opacity] duration-300',
      unread ? 'bg-surface-subtle' : 'opacity-[.62] hover:bg-surface-subtle',
    ]"
  >
    <span
      aria-hidden="true"
      :class="[
        'flex size-[38px] shrink-0 items-center justify-center rounded-[10px]',
        notification.kind === 'invitation_accepted' ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground',
      ]"
    >
      <component :is="icon" class="size-[18px]" :stroke-width="1.8" />
    </span>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <NuxtLink
        :to="notificationLink(notification)"
        class="text-[15px] leading-[1.45] text-foreground underline-offset-[3px] hover:underline"
        @click="emit('open')"
      >
        <span class="font-semibold">{{ who }}</span> {{ meta.action }}
      </NuxtLink>
      <span class="text-[13px] text-muted-foreground">{{ meta.label }} · {{ notificationTime(notification.createdAt) }}</span>
    </div>
    <Button
      v-if="unread"
      variant="ghost"
      size="icon-sm"
      class="shrink-0 text-muted-foreground"
      :loading="marking"
      :aria-label="`Marcar como lida: ${who}`"
      title="Marcar como lida"
      @click="emit('markRead')"
    >
      <Check v-if="!marking" class="size-[18px]" :stroke-width="1.8" />
    </Button>
    <span v-if="unread" aria-hidden="true" class="mt-2 size-2 shrink-0 rounded-full bg-primary" />
    <span v-if="unread" class="sr-only">Não lida</span>
  </article>
</template>
