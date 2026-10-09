<script setup lang="ts">
import { CircleDot, Home, ListChecks } from 'lucide-vue-next'

// Shell da paciente: no celular, tabbar fixa embaixo (protótipo); a partir de
// `md`, a mesma navegação vai para uma barra no topo. "Histórico" (prontuário
// da paciente) entra quando o endpoint do portal existir.
const route = useRoute()
const items = [
  { label: 'Início', to: '/patient', icon: Home },
  { label: 'Atividades', to: '/patient/activities', icon: ListChecks },
  { label: 'Check-in', to: '/patient/check-in', icon: CircleDot },
]
// Ao responder uma atividade, a barra de ação é a única coisa fixa embaixo.
const hideTabbar = computed(() => /^\/patient\/activities\/[^/]+/.test(route.path))
function isActive(to: string) {
  if (to === '/patient') return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div :class="['min-h-dvh bg-background text-foreground md:pb-0', hideTabbar ? '' : 'pb-24']">
    <header class="hidden border-b bg-card md:block">
      <div class="mx-auto flex h-16 max-w-3xl items-center justify-between px-8">
        <NuxtLink to="/patient" aria-label="Ir para o início"><AppLogo /></NuxtLink>
        <nav class="flex items-center gap-1" aria-label="Navegação da paciente">
          <NuxtLink
            v-for="item in items"
            :key="item.to"
            :to="item.to"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            :class="[
              'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
              isActive(item.to) ? 'bg-accent text-accent-foreground' : 'text-secondary-foreground hover:bg-surface-hover hover:text-foreground',
            ]"
          >
            <component :is="item.icon" class="size-4" :stroke-width="1.8" aria-hidden="true" />{{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto flex max-w-3xl flex-col px-5 pt-6 md:px-8 md:py-10">
      <slot />
    </main>
    <nav v-if="!hideTabbar" class="fixed inset-x-0 bottom-0 z-20 border-t bg-card px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-1 md:hidden" aria-label="Navegação da paciente">
      <div class="mx-auto flex max-w-md">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          :class="[
            'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
            isActive(item.to) ? 'text-brand' : 'text-muted-foreground',
          ]"
        >
          <component :is="item.icon" class="size-[22px]" :stroke-width="1.8" aria-hidden="true" /><span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
