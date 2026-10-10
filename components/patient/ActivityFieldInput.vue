<script setup lang="ts">
import { CheckboxCard } from '@/components/ui/checkbox-card'
import { DatePicker } from '@/components/ui/date-picker'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { FieldAnswer, PatientActivityField } from '~/schemas/patient-activity'

// Um controle por tipo de campo, tudo com componentes de components/ui
// (regras A1–A3 do guia). Sem <input type="checkbox">, sem <select>, sem
// <input type="date"> nativos.
const props = defineProps<{
  field: PatientActivityField
  modelValue: FieldAnswer
}>()

const emit = defineEmits<{ 'update:modelValue': [FieldAnswer] }>()

const options = computed(() => props.field.config.options ?? [])

const scaleSteps = computed(() => {
  const min = props.field.config.min ?? 1
  const max = props.field.config.max ?? 10
  const steps: number[] = []
  for (let value = min; value <= max; value++) steps.push(value)
  return steps
})

// Sim/Não e escolha única usam o mesmo cartão de opção.
const singleChoices = computed<{ label: string, value: string | boolean }[]>(() => props.field.fieldType === 'boolean'
  ? [{ label: 'Sim', value: true }, { label: 'Não', value: false }]
  : options.value.map(option => ({ label: option, value: option })))

const singleValues = computed(() => singleChoices.value.map(choice => choice.value))

const selectedChoices = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

function toggleChoice(option: string, checked: boolean) {
  const current = selectedChoices.value
  emit('update:modelValue', checked ? [...current, option] : current.filter((item) => item !== option))
}

// Grupos de rádio (escala, Sim/Não, escolha única): uma parada de Tab no item
// marcado (ou no primeiro) e setas mudando a escolha, como no MoodPicker.
function radioTabindex(values: FieldAnswer[], index: number) {
  const selected = values.findIndex(value => value === props.modelValue)
  return index === (selected === -1 ? 0 : selected) ? 0 : -1
}
function onRadioKeydown(event: KeyboardEvent, values: FieldAnswer[], index: number) {
  const last = values.length - 1
  const next = ({
    ArrowRight: index === last ? 0 : index + 1,
    ArrowDown: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    ArrowUp: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  } as Record<string, number>)[event.key]
  if (next === undefined) return
  event.preventDefault()
  emit('update:modelValue', values[next] ?? null)
  const group = (event.currentTarget as HTMLElement).parentElement
  ;(group?.querySelectorAll<HTMLElement>('[role="radio"]')[next])?.focus()
}

const maxLength = computed(() => props.field.config.maxLength)
const textLength = computed(() => (typeof props.modelValue === 'string' ? props.modelValue.length : 0))
</script>

<template>
  <div class="flex flex-col gap-3">
    <Input
      v-if="field.fieldType === 'short_text'"
      :model-value="(modelValue as string) ?? ''"
      :maxlength="maxLength"
      :aria-label="field.label"
      class="h-12 text-base"
      placeholder="Escreva aqui"
      @update:model-value="(value) => emit('update:modelValue', String(value))"
    />

    <template v-else-if="field.fieldType === 'long_text'">
      <Textarea
        :model-value="(modelValue as string) ?? ''"
        :maxlength="maxLength"
        :aria-label="field.label"
        rows="7"
        class="text-base"
        placeholder="Escreva com suas palavras"
        @update:model-value="(value) => emit('update:modelValue', String(value))"
      />
      <p v-if="maxLength" class="text-right text-xs text-muted-foreground tabular-nums">
        {{ textLength }} / {{ maxLength }}
      </p>
    </template>

    <!-- Escala: grade de números de 48px (protótipo), sem range nativo; o valor
         escolhido fica visível sem arrastar. -->
    <div v-else-if="field.fieldType === 'scale'" class="flex flex-col gap-2">
      <div class="grid grid-cols-5 gap-2" role="radiogroup" :aria-label="field.label">
        <button
          v-for="(step, index) in scaleSteps"
          :key="step"
          type="button"
          role="radio"
          :tabindex="radioTabindex(scaleSteps, index)"
          class="h-12 rounded-lg border text-[15px] font-semibold tabular-nums transition-[transform,background-color,border-color,color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          :class="modelValue === step ? '-translate-y-[3px] border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-secondary-foreground hover:border-input-hover'"
          :aria-checked="modelValue === step"
          @click="emit('update:modelValue', step)"
          @keydown="onRadioKeydown($event, scaleSteps, index)"
        >
          {{ step }}
        </button>
      </div>
      <div
        v-if="field.config.minLabel || field.config.maxLabel"
        class="flex justify-between gap-4 text-xs text-muted-foreground"
      >
        <span>{{ field.config.minLabel }}</span>
        <span class="text-right">{{ field.config.maxLabel }}</span>
      </div>
    </div>

    <!-- Sim/Não e escolha única: cartões grandes (protótipo `.opt`). -->
    <div
      v-else-if="field.fieldType === 'boolean' || field.fieldType === 'single_choice'"
      class="flex flex-col gap-2.5"
      role="radiogroup"
      :aria-label="field.label"
    >
      <button
        v-for="(choice, index) in singleChoices"
        :key="String(choice.value)"
        type="button"
        role="radio"
        :tabindex="radioTabindex(singleValues, index)"
        class="flex w-full items-center gap-3 rounded-[14px] border bg-card p-3.5 text-left text-[15px] font-medium transition-[background-color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        :class="modelValue === choice.value ? 'border-primary bg-surface-subtle' : 'border-border hover:border-input-hover'"
        :aria-checked="modelValue === choice.value"
        @click="emit('update:modelValue', choice.value)"
        @keydown="onRadioKeydown($event, singleValues, index)"
      >
        <span
          aria-hidden="true"
          class="flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors"
          :class="modelValue === choice.value ? 'border-primary' : 'border-input-hover'"
        ><span v-if="modelValue === choice.value" class="size-2.5 rounded-full bg-primary" /></span>
        {{ choice.label }}
      </button>
    </div>

    <!-- Múltipla escolha: o cartão inteiro marca (CheckboxCard). -->
    <div v-else-if="field.fieldType === 'multiple_choice'" class="flex flex-col gap-2.5" role="group" :aria-label="field.label">
      <CheckboxCard
        v-for="(option, index) in options"
        :id="`${field.code}-${index}`"
        :key="option"
        :title="option"
        class="rounded-[14px] p-3.5"
        :model-value="selectedChoices.includes(option)"
        @update:model-value="(checked: boolean) => toggleChoice(option, checked)"
      />
    </div>

    <DatePicker
      v-else-if="field.fieldType === 'date'"
      :model-value="(modelValue as string) ?? ''"
      @update:model-value="(value) => emit('update:modelValue', value ?? null)"
    />

    <DateTimePicker
      v-else-if="field.fieldType === 'datetime'"
      :model-value="(modelValue as string) ?? ''"
      @update:model-value="(value) => emit('update:modelValue', value ?? null)"
    />
  </div>
</template>
