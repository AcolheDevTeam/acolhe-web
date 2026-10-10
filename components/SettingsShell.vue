<script setup lang="ts">
import type { User } from '~/types'

// Moldura das telas de Ajustes (protótipos "Perfil" e "Segurança", ACO-98):
// cabeçalho "Ajustes" + título e a sub-navegação à esquerda (no celular, em
// linha acima do conteúdo). Só aparecem as seções que existem: Perfil para
// quem atende, Segurança para todos e Assinatura para quem tem cobrança.
defineProps<{ title: string }>()

const { data: me } = useNuxtData<User | null>('me')
const route = useRoute()

const links = computed(() => [
  ...(me.value?.role === 'psychologist' ? [{ label: 'Perfil', to: '/ajustes/perfil' }] : []),
  { label: 'Segurança', to: '/ajustes/seguranca' },
  ...(hasBilling(me.value) ? [{ label: 'Assinatura', to: BILLING_PATH }] : []),
])
</script>

<template>
  <PageHeader eyebrow="Ajustes" :title="title" />
  <div class="flex flex-col gap-6 px-4 pb-32 pt-6 md:flex-row md:items-start md:gap-8 md:px-8 md:pt-7 lg:px-12">
    <nav aria-label="Ajustes" class="animate-rise flex flex-wrap gap-1 md:w-[220px] md:shrink-0 md:flex-col">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :aria-current="route.path === link.to ? 'page' : undefined"
        :class="[
          'relative flex h-10 items-center rounded-lg px-3.5 text-sm font-medium transition-colors',
          route.path === link.to
            ? 'bg-card text-brand shadow-[0_1px_2px_rgba(22,26,58,.08)] before:absolute before:inset-y-2.5 before:left-0 before:w-[3px] before:rounded-sm before:bg-primary'
            : 'text-secondary-foreground hover:bg-surface-hover hover:text-foreground',
        ]"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>
    <div class="flex min-w-0 max-w-[760px] flex-1 flex-col gap-6">
      <slot />
    </div>
  </div>
</template>
