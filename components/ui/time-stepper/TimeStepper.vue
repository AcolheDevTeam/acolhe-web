<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { Minus, Plus } from "lucide-vue-next"
import { cn } from "@/lib/utils"

// Horário em passos fixos (protótipo do check-in: "−  23h30  +"). Substitui o
// <input type="time"> nativo (regra A2). O valor é "HH:MM" e dá a volta na
// meia-noite. O horário é um spinbutton: setas para cima/baixo andam um passo,
// PageUp/PageDown andam uma hora. Os botões − e + fazem o mesmo com o toque.
const props = withDefaults(defineProps<{
  label: string
  step?: number
  disabled?: boolean
  class?: HTMLAttributes["class"]
}>(), { step: 15 })
const model = defineModel<string>({ required: true })

const minutes = computed(() => clockToMinutes(model.value) ?? 0)
const display = computed(() => clockLabel(minutesToClock(minutes.value)))

function move(delta: number) {
  if (props.disabled) return
  model.value = minutesToClock(minutes.value + delta)
}

function onKeydown(event: KeyboardEvent) {
  const delta = ({ ArrowUp: props.step, ArrowRight: props.step, ArrowDown: -props.step, ArrowLeft: -props.step, PageUp: 60, PageDown: -60 } as Record<string, number>)[event.key]
  if (delta === undefined) return
  event.preventDefault()
  move(delta)
}
</script>

<template>
  <div role="group" :aria-label="label" :class="cn('flex items-center gap-1.5', props.class)">
    <button
      type="button"
      :aria-label="`${step} minutos mais cedo`"
      :disabled="disabled"
      class="flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-card text-foreground transition-colors duration-200 hover:border-input-hover hover:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:opacity-60"
      @click="move(-step)"
    >
      <Minus class="size-4" aria-hidden="true" />
    </button>
    <span
      role="spinbutton"
      :tabindex="disabled ? -1 : 0"
      :aria-label="label"
      :aria-valuenow="minutes"
      aria-valuemin="0"
      :aria-valuemax="24 * 60 - step"
      :aria-valuetext="display"
      :aria-disabled="disabled || undefined"
      class="min-w-[4.25rem] rounded-md text-center font-mono text-lg font-medium tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      @keydown="onKeydown"
    >{{ display }}</span>
    <button
      type="button"
      :aria-label="`${step} minutos mais tarde`"
      :disabled="disabled"
      class="flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-card text-foreground transition-colors duration-200 hover:border-input-hover hover:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:opacity-60"
      @click="move(step)"
    >
      <Plus class="size-4" aria-hidden="true" />
    </button>
  </div>
</template>
