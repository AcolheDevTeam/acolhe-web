<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

// Spinner do protótipo: anel de 2px com o topo na cor do texto.
const props = defineProps<{
  class?: HTMLAttributes["class"]
  /** Texto para leitores de tela; sem ele o spinner é decorativo. */
  label?: string
}>()
</script>

<template>
  <span
    :role="label ? 'status' : undefined"
    :aria-hidden="label ? undefined : 'true'"
    :class="cn('inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-[color-mix(in_srgb,currentColor_35%,transparent)] border-t-current', props.class)"
  >
    <span v-if="label" class="sr-only">{{ label }}</span>
  </span>
</template>
