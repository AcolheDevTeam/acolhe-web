<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import type { User } from '~/types'

// Cabeçalho das telas da paciente (protótipo): eyebrow mono + H1 e o avatar à
// direita (só no Início, como no protótipo: `account`), que leva a Ajustes
// (ACO-102). `back` põe a seta de voltar antes do título, como em Ajustes.
defineProps<{ title: string, eyebrow?: string, description?: string, account?: boolean, back?: string, backLabel?: string }>()

const { data: me } = useFetch<User | null>('/api/me', { key: 'me' })
const name = computed(() => me.value?.patient?.fullName ?? '')
const initials = computed(() => name.value.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase())
</script>

<template>
  <header class="animate-rise flex items-center justify-between gap-4">
    <div class="flex min-w-0 items-center gap-1.5">
      <NuxtLink
        v-if="back"
        :to="back"
        :aria-label="backLabel ?? 'Voltar'"
        class="-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        <ChevronLeft class="size-5" :stroke-width="1.8" aria-hidden="true" />
      </NuxtLink>
      <div class="flex min-w-0 flex-col gap-1.5">
        <p v-if="eyebrow" class="label-mono">{{ eyebrow }}</p>
        <h1 :class="['font-semibold leading-[1.1]', account ? 'text-[30px] tracking-[-0.03em]' : back ? 'text-2xl tracking-[-0.02em]' : 'text-[28px] tracking-[-0.03em]']">{{ title }}</h1>
        <p v-if="description || $slots.description" class="flex items-center gap-1.5 text-[13px] leading-relaxed text-muted-foreground"><slot name="description">{{ description }}</slot></p>
      </div>
    </div>
    <NuxtLink
      v-if="account"
      to="/patient/ajustes"
      class="flex size-11 shrink-0 items-center justify-center rounded-full bg-positive-soft text-sm font-semibold text-positive transition-transform duration-300 ease-out hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      aria-label="Ajustes da sua conta"
    >
      {{ initials || '·' }}
    </NuxtLink>
  </header>
</template>
