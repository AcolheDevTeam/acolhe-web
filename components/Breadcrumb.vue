<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

// Caminho das telas de detalhe ("Pacientes / Júlia Andrade / Sessão 28"), em
// mono, no slot `title` do PageHeader. Todo trecho antes do último é link; o
// último é a página atual (aria-current). Quando o trecho atual é o título da
// página, `current-tag="h1"`. `hideOnMobile` esconde um trecho no celular.
export interface BreadcrumbItem {
  label: string
  to?: RouteLocationRaw
  hideOnMobile?: boolean
}

const { items, currentTag = 'span' } = defineProps<{
  items: BreadcrumbItem[]
  currentTag?: 'span' | 'h1'
}>()

const trail = computed(() => items.slice(0, -1))
const current = computed(() => items.at(-1))
</script>

<template>
  <nav aria-label="Breadcrumb" class="min-w-0">
    <ol class="flex min-w-0 items-center gap-2 font-mono text-xs tracking-[.06em] text-muted-foreground">
      <li
        v-for="(item, i) in trail"
        :key="i"
        class="flex min-w-0 items-center gap-2"
        :class="{ 'max-sm:hidden': item.hideOnMobile }"
      >
        <NuxtLink
          v-if="item.to"
          :to="item.to"
          class="min-w-0 truncate rounded-sm underline-offset-[3px] hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          {{ item.label }}
        </NuxtLink>
        <span v-else class="min-w-0 truncate">{{ item.label }}</span>
        <span aria-hidden="true">/</span>
      </li>
      <li v-if="current" class="flex min-w-0 items-center">
        <component :is="currentTag" aria-current="page" class="min-w-0 truncate font-normal text-foreground">
          {{ current.label }}
        </component>
      </li>
    </ol>
  </nav>
</template>
