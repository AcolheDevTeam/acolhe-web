<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Bell } from 'lucide-vue-next'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Sino com contador de não lidas (protótipo "Notificações"). Leva à caixa.
// Contador em #A33A3A, não no #D9503C do protótipo: branco sobre o salmão
// fica abaixo de 4,5:1 (novo-design.md, contraste).
const props = defineProps<{ class?: HTMLAttributes['class'], size?: 'default' | 'sm' }>()

// O contador se atualiza a cada navegação dentro do composable, uma vez só.
const { count, enabled } = useUnreadNotifications()
const route = useRoute()
</script>

<template>
  <NuxtLink
    v-if="enabled"
    to="/notificacoes"
    :aria-label="bellLabel(count)"
    :title="bellLabel(count)"
    :aria-current="route.path === '/notificacoes' ? 'page' : undefined"
    :class="cn(buttonVariants({ variant: 'outline', size: props.size === 'sm' ? 'icon-sm' : 'icon' }), 'relative text-brand', props.class)"
  >
    <Bell class="size-[18px]" :stroke-width="1.8" aria-hidden="true" />
    <span
      v-if="count > 0"
      aria-hidden="true"
      class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 font-mono text-[11px] font-semibold leading-none text-destructive-foreground"
    >
      {{ badgeCount(count) }}
    </span>
  </NuxtLink>
</template>
