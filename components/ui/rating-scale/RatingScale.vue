<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

// Escala numerada de 1 a `max` (protótipo do check-in: qualidade do sono).
// Grupo de rádio com setas e uma parada de Tab. O valor pode ficar vazio
// (null) até a pessoa escolher; os rótulos das pontas ficam embaixo.
const props = withDefaults(defineProps<{
  label: string
  max?: number
  minLabel?: string
  maxLabel?: string
  disabled?: boolean
  class?: HTMLAttributes["class"]
}>(), { max: 5 })
const model = defineModel<number | null>({ required: true })

const values = computed(() => Array.from({ length: props.max }, (_, i) => i + 1))
const buttons = ref<HTMLButtonElement[]>([])

function onKeydown(event: KeyboardEvent, value: number) {
  const next = ({ ArrowRight: value + 1, ArrowDown: value + 1, ArrowLeft: value - 1, ArrowUp: value - 1, Home: 1, End: props.max } as Record<string, number>)[event.key]
  if (next === undefined || props.disabled) return
  event.preventDefault()
  const wrapped = next > props.max ? 1 : next < 1 ? props.max : next
  model.value = wrapped
  buttons.value[wrapped - 1]?.focus()
}
</script>

<template>
  <div :class="cn('flex flex-col gap-1.5', props.class)">
    <div role="radiogroup" :aria-label="label" class="flex gap-1.5">
      <button
        v-for="value in values"
        :key="value"
        ref="buttons"
        type="button"
        role="radio"
        :aria-checked="model === value"
        :tabindex="model === value || (!model && value === 1) ? 0 : -1"
        :disabled="disabled"
        :class="cn(
          'h-11 min-w-0 flex-1 rounded-[10px] border text-sm font-medium transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:opacity-60',
          model === value ? 'border-selected-border bg-accent text-success' : 'border-border bg-card text-secondary-foreground hover:border-input-hover',
        )"
        @click="model = value"
        @keydown="onKeydown($event, value)"
      >
        {{ value }}
      </button>
    </div>
    <div v-if="minLabel || maxLabel" class="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
      <span>{{ minLabel }}</span>
      <span>{{ maxLabel }}</span>
    </div>
  </div>
</template>
