<script setup lang="ts">
import { CircleDot, History, Home, ListChecks } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { InlineNotice } from '@/components/ui/inline-notice'
import type { User } from '~/types'

// Shell da paciente: no celular, tabbar fixa embaixo (protótipo); a partir de
// `md`, a mesma navegação vai para uma barra no topo. "Histórico" é o "Meu
// prontuário" (ACO-88). Responder uma atividade usa tela própria, sem este
// layout (pages/patient/activities/[id]).
const route = useRoute()
const items = [
  { label: 'Início', to: '/patient', icon: Home },
  { label: 'Atividades', to: '/patient/activities', icon: ListChecks },
  { label: 'Check-in', to: '/patient/check-in', icon: CircleDot },
  { label: 'Histórico', to: '/patient/historico', icon: History },
]
// Sem vínculo ativo, Início, Atividades e Check-in não têm dados para ela; em
// vez do erro genérico, a tela diz o motivo e leva ao Histórico, que continua
// aberto (CFP 01/2009, art. 5º, II), e aos Ajustes, onde ela revê os
// consentimentos e pede os próprios dados (ACO-102).
const { data: me } = useNuxtData<User | null>('me')
const linkReason = computed(() => inactiveLinkReason(me.value?.patient))
const blocked = computed(() => linkReason.value !== null && !openWithoutLink(route.path))
// "Sair" fica em Ajustes; o aviso também oferece a saída.
const { logout, isLoggingOut } = useLogout()
function isActive(to: string) {
  if (to === '/patient') return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="min-h-dvh bg-background pb-24 text-foreground md:pb-0">
    <header class="hidden border-b bg-card md:block">
      <div class="mx-auto flex h-16 max-w-3xl items-center justify-between px-8">
        <NuxtLink to="/patient" aria-label="Ir para o início"><AppLogo /></NuxtLink>
        <nav class="flex items-center gap-1" aria-label="Navegação do(a) paciente">
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
    <main class="mx-auto flex max-w-3xl flex-col px-5 pb-6 pt-7 md:px-8 md:py-10">
      <div v-if="blocked" class="flex flex-col items-start gap-4">
        <InlineNotice tone="neutral" class="w-full">
          {{ linkReason }} Você ainda pode ler o registro das suas sessões.
        </InlineNotice>
        <div class="flex flex-wrap gap-2">
          <Button as-child>
            <NuxtLink to="/patient/historico">Ver meu histórico</NuxtLink>
          </Button>
          <Button variant="outline" as-child>
            <NuxtLink to="/patient/ajustes">Abrir ajustes</NuxtLink>
          </Button>
          <Button variant="ghost" :disabled="isLoggingOut" @click="logout">{{ isLoggingOut ? 'Saindo…' : 'Sair' }}</Button>
        </div>
      </div>
      <slot v-else />
    </main>
    <nav class="fixed inset-x-0 bottom-0 z-20 border-t bg-card px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-1 md:hidden" aria-label="Navegação do(a) paciente">
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
