<script setup lang="ts" generic="T extends string">
import type { HTMLAttributes } from "vue"
import { computed } from "vue"
import { cn } from "@/lib/utils"

// Escolha entre poucas opções que não troca de painel (protótipo: "Sou
// psicóloga(o) / Sou paciente", "Hoje / Semana"). Pílula branca desliza até a
// opção ativa. Para alternar conteúdo com painéis, use Tabs.
const props = defineProps<{
  options: { value: T, label: string }[]
  label: string
  size?: "sm" | "lg"
  disabled?: boolean
  class?: HTMLAttributes["class"]
}>()
const model = defineModel<T>({ required: true })

const index = computed(() => Math.max(0, props.options.findIndex(o => o.value === model.value)))
</script>

<template>
  <div
    role="group"
    :aria-label="label"
    :aria-disabled="disabled || undefined"
    :class="cn('relative flex rounded-xl bg-secondary p-1', disabled && 'opacity-60', props.class)"
  >
    <span
      aria-hidden="true"
      class="absolute inset-y-1 left-1 rounded-lg bg-card shadow-[0_1px_2px_rgba(22,26,58,.08),0_4px_12px_rgba(22,26,58,.06)] transition-transform duration-[420ms] ease-[cubic-bezier(.2,.7,.2,1)]"
      :style="{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }"
    />
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :aria-pressed="model === option.value"
      :disabled="disabled"
      :class="cn(
        'relative z-[1] flex-1 rounded-lg font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
        size === 'lg' ? 'h-11 text-sm' : 'h-8 text-[13px]',
        model === option.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        'disabled:cursor-not-allowed',
      )"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
