<script setup lang="ts" generic="T extends string">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

// Chips de opção do protótipo (seção 2 do mapa): pílulas de 32px para filtros
// curtos e sempre visíveis, como o "Tipo" da biblioteca de templates. Escolha
// única; o chip ativo fica em índigo claro. Para listas longas, use
// CustomDropdown (pesquisável).
const props = defineProps<{
  options: { value: T, label: string }[]
  label: string
  class?: HTMLAttributes["class"]
}>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div role="group" :aria-label="label" :class="cn('flex flex-wrap items-center gap-2', props.class)">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="model === option.value"
      :class="cn(
        'h-8 rounded-full border px-3 text-[13px] transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
        model === option.value
          ? 'border-selected-border bg-accent text-success'
          : 'border-border bg-card text-secondary-foreground hover:border-input-hover',
      )"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
