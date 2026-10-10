<script setup lang="ts">
import { cn } from '@/lib/utils'

// Escala de humor do protótipo: cinco botões com a cor do nível e o nome
// ("Difícil" a "Bem"). Grupo de rádio com setas, uma parada de Tab.
const props = defineProps<{ label: string, disabled?: boolean }>()
const model = defineModel<number>({ required: true })

const shades = ['bg-mood-1', 'bg-mood-2', 'bg-mood-3', 'bg-mood-4', 'bg-mood-5']
const buttons = ref<HTMLButtonElement[]>([])

function onKeydown(event: KeyboardEvent, value: number) {
  const next = ({ ArrowRight: value + 1, ArrowDown: value + 1, ArrowLeft: value - 1, ArrowUp: value - 1 } as Record<string, number>)[event.key]
  if (next === undefined || props.disabled) return
  event.preventDefault()
  const wrapped = next > 5 ? 1 : next < 1 ? 5 : next
  model.value = wrapped
  buttons.value[wrapped - 1]?.focus()
}
</script>

<template>
  <div role="radiogroup" :aria-label="label" class="flex gap-1.5">
    <button
      v-for="(name, index) in MOOD_LABELS"
      :key="name"
      ref="buttons"
      type="button"
      role="radio"
      :aria-checked="model === index + 1"
      :tabindex="model === index + 1 || (!model && index === 0) ? 0 : -1"
      :disabled="disabled"
      :class="cn(
        'flex h-[72px] min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-[14px] border text-secondary-foreground transition-[transform,background-color,border-color,color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:opacity-60',
        model === index + 1 ? '-translate-y-1 border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-input-hover',
      )"
      @click="model = index + 1"
      @keydown="onKeydown($event, index + 1)"
    >
      <span
        aria-hidden="true"
        :class="cn('size-[22px] rounded-full', shades[index], model === index + 1 ? 'shadow-[0_0_0_2px_#fff]' : 'shadow-[inset_0_0_0_1px_rgba(22,26,58,.12)]')"
      />
      <span class="text-xs font-medium">{{ name }}</span>
    </button>
  </div>
</template>
