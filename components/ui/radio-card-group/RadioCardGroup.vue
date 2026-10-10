<script setup lang="ts" generic="T extends string">
import type { HTMLAttributes } from "vue"
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from "reka-ui"
import { cn } from "@/lib/utils"

// Rádio em cartão do protótipo (`.opt` do tipo de documento, `.choice`): cartão
// com título e descrição; o selecionado ganha borda índigo, anel e fundo claro.
// Escolha única com setas do teclado (reka-ui RadioGroup), sem rádio nativo.
export interface RadioCardOption<V extends string = string> {
  value: V
  label: string
  description?: string
  disabled?: boolean
}

const props = defineProps<{
  options: RadioCardOption<T>[]
  label: string
  disabled?: boolean
  /** Variante baixa para seleções curtas dentro de formulários mobile. */
  compact?: boolean
  class?: HTMLAttributes["class"]
}>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <RadioGroupRoot
    v-model="model"
    :aria-label="label"
    :disabled="disabled"
    :class="cn('grid gap-2.5 sm:grid-cols-2', props.class)"
  >
    <RadioGroupItem
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="option.disabled"
      :class="cn(
        'group flex w-full rounded-xl border bg-card transition-[border-color,background-color,box-shadow] duration-200 hover:border-input-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
        compact ? 'items-center justify-center px-2.5 py-3 text-center' : 'items-start gap-3 p-3.5 text-left',
        'data-[state=checked]:border-primary data-[state=checked]:bg-surface-subtle data-[state=checked]:shadow-[0_0_0_3px_rgba(64,64,214,.12)]',
      )"
    >
      <span
        v-if="!compact"
        aria-hidden="true"
        class="mt-px grid size-[22px] shrink-0 place-content-center rounded-full border-[1.5px] border-input-hover bg-card transition-colors group-data-[state=checked]:border-primary"
      >
        <RadioGroupIndicator class="size-2.5 rounded-full bg-primary" />
      </span>
      <span :class="cn('flex min-w-0 flex-col gap-0.5', compact && 'items-center')">
        <span :class="cn('font-semibold text-foreground', compact ? 'text-[13px] leading-tight' : 'text-[15px]')">{{ option.label }}</span>
        <span v-if="option.description && !compact" class="text-[13px] text-muted-foreground">{{ option.description }}</span>
      </span>
    </RadioGroupItem>
  </RadioGroupRoot>
</template>
