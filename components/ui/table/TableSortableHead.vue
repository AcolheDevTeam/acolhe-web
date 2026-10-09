<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { ArrowDown, ArrowUp } from "lucide-vue-next"
import { cn } from "@/lib/utils"
import TableHead from "./TableHead.vue"

// Cabeçalho clicável com seta de ordenação (protótipo, "Tabela / lista").
// `direction` vazio = coluna não ordenada; o pai decide a próxima direção.
const props = defineProps<{
  direction?: "asc" | "desc" | null
  class?: HTMLAttributes["class"]
}>()

const emit = defineEmits<{ (e: "sort"): void }>()

const ariaSort = computed(() =>
  props.direction === "asc" ? "ascending" : props.direction === "desc" ? "descending" : "none")
</script>

<template>
  <TableHead :aria-sort="ariaSort" :class="cn('p-0', props.class)">
    <button
      type="button"
      class="inline-flex h-11 items-center gap-1.5 rounded-md px-4 uppercase tracking-[0.12em] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      @click="emit('sort')"
    >
      <slot />
      <ArrowUp v-if="direction === 'asc'" class="size-3.5" aria-hidden="true" />
      <ArrowDown v-else-if="direction === 'desc'" class="size-3.5" aria-hidden="true" />
    </button>
  </TableHead>
</template>
