<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

// Estado vazio do protótipo: bloco tracejado, título curto, texto de apoio e
// uma ação secundária opcional (slot `action`). `compact` é a versão das listas
// e tabelas, só com o texto.
const props = defineProps<{
  title?: string
  description?: string
  compact?: boolean
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    :class="cn(
      'flex flex-col items-center rounded-2xl border border-dashed border-input-hover text-center',
      compact ? 'gap-1 px-4 py-8' : 'gap-1.5 px-6 py-12',
      props.class,
    )"
  >
    <p v-if="title" class="text-base font-semibold text-foreground">{{ title }}</p>
    <div v-if="description || $slots.default" class="max-w-md text-sm leading-relaxed text-muted-foreground">
      <slot>{{ description }}</slot>
    </div>
    <div v-if="$slots.action" class="mt-3 flex flex-wrap items-center justify-center gap-2">
      <slot name="action" />
    </div>
  </div>
</template>
