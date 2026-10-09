<script setup lang="ts" generic="T extends string">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

// Chips de opção do protótipo (seção 2 do mapa): pílulas de 32px para filtros
// curtos e sempre visíveis, como o "Tipo" da biblioteca de templates. O chip
// ativo fica em índigo claro. Para listas longas, use CustomDropdown
// (pesquisável).
// - Escolha única (padrão): `radiogroup` com `radio`, uma parada de Tab e setas
//   movendo a seleção (tabindex móvel).
// - `multiple`: cada chip é um `checkbox` independente; o modelo é uma lista.
const props = defineProps<{
  options: { value: T, label: string }[]
  label: string
  multiple?: boolean
  class?: HTMLAttributes["class"]
}>()
const model = defineModel<T | T[]>({ required: true })

const selected = (value: T) =>
  Array.isArray(model.value) ? model.value.includes(value) : model.value === value

function toggle(value: T) {
  if (!props.multiple) {
    model.value = value
    return
  }
  const list = Array.isArray(model.value) ? model.value : []
  model.value = list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

// Só o chip selecionado (ou o primeiro) entra no Tab na escolha única.
const activeIndex = computed(() => Math.max(0, props.options.findIndex(o => selected(o.value))))
const buttons = ref<HTMLButtonElement[]>([])

function onKeydown(event: KeyboardEvent, index: number) {
  if (props.multiple) return
  const last = props.options.length - 1
  const next = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowDown: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    ArrowUp: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }[event.key]
  if (next === undefined) return
  event.preventDefault()
  model.value = props.options[next]!.value
  buttons.value[next]?.focus()
}
</script>

<template>
  <div
    :role="multiple ? 'group' : 'radiogroup'"
    :aria-label="label"
    :class="cn('flex flex-wrap items-center gap-2', props.class)"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      ref="buttons"
      type="button"
      :role="multiple ? 'checkbox' : 'radio'"
      :aria-checked="selected(option.value)"
      :tabindex="multiple || index === activeIndex ? 0 : -1"
      :class="cn(
        'h-8 rounded-full border px-3 text-[13px] transition-[background-color,border-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
        selected(option.value)
          ? 'border-selected-border bg-accent text-success'
          : 'border-border bg-card text-secondary-foreground hover:border-input-hover',
      )"
      @click="toggle(option.value)"
      @keydown="onKeydown($event, index)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
