<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox'
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

// Escala vira uma fileira de botões: funciona no toque, não usa range nativo e
// deixa o valor escolhido visível sem precisar arrastar.
const scaleSteps = computed(() => {
  const min = props.field.config.min ?? 1
  const max = props.field.config.max ?? 10
  const steps: number[] = []
  for (let value = min; value <= max; value++) steps.push(value)
  return steps
})

const selectedChoices = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

function toggleChoice(option: string, checked: boolean) {
  const current = selectedChoices.value
  emit('update:modelValue', checked ? [...current, option] : current.filter((item) => item !== option))
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
      placeholder="Escreva aqui"
      @update:model-value="(value) => emit('update:modelValue', String(value))"
    />

    <template v-else-if="field.fieldType === 'long_text'">
      <Textarea
        :model-value="(modelValue as string) ?? ''"
        :maxlength="maxLength"
        :aria-label="field.label"
        rows="6"
        placeholder="Escreva aqui"
        @update:model-value="(value) => emit('update:modelValue', String(value))"
      />
      <p v-if="maxLength" class="text-right text-xs text-muted-foreground tabular-nums">
        {{ textLength }} / {{ maxLength }}
      </p>
    </template>

    <div v-else-if="field.fieldType === 'scale'" class="flex flex-col gap-2">
      <div class="flex flex-wrap gap-2" role="group" :aria-label="field.label">
        <button
          v-for="step in scaleSteps"
          :key="step"
          type="button"
          class="size-11 rounded-xl border text-sm tabular-nums transition-colors hover:bg-muted"
          :class="modelValue === step ? 'border-foreground bg-foreground text-background hover:bg-foreground' : 'border-input'"
          :aria-pressed="modelValue === step"
          @click="emit('update:modelValue', step)"
        >
          {{ step }}
        </button>
      </div>
      <div
        v-if="field.config.minLabel || field.config.maxLabel"
        class="flex justify-between text-xs text-muted-foreground"
      >
        <span>{{ field.config.minLabel }}</span>
        <span>{{ field.config.maxLabel }}</span>
      </div>
    </div>

    <div v-else-if="field.fieldType === 'boolean'" class="grid gap-3 sm:grid-cols-2">
      <button
        v-for="choice in [{ label: 'Sim', value: true }, { label: 'Não', value: false }]"
        :key="String(choice.value)"
        type="button"
        class="rounded-xl border px-5 py-4 text-left text-sm transition-colors hover:bg-muted"
        :class="modelValue === choice.value ? 'border-foreground bg-muted' : 'border-input'"
        :aria-pressed="modelValue === choice.value"
        @click="emit('update:modelValue', choice.value)"
      >
        {{ choice.label }}
      </button>
    </div>

    <!-- Escolha única e múltipla: cartões grandes, como na tela 19 do design. -->
    <div v-else-if="field.fieldType === 'single_choice'" class="flex flex-col gap-3">
      <button
        v-for="option in options"
        :key="option"
        type="button"
        class="rounded-xl border px-5 py-4 text-left text-sm transition-colors hover:bg-muted"
        :class="modelValue === option ? 'border-foreground bg-muted' : 'border-input'"
        :aria-pressed="modelValue === option"
        @click="emit('update:modelValue', option)"
      >
        {{ option }}
      </button>
    </div>

    <div v-else-if="field.fieldType === 'multiple_choice'" class="flex flex-col gap-3">
      <div
        v-for="option in options"
        :key="option"
        class="flex items-start gap-3 rounded-xl border px-5 py-4 transition-colors"
        :class="selectedChoices.includes(option) ? 'border-foreground bg-muted' : 'border-input'"
      >
        <Checkbox
          :id="`${field.code}-${option}`"
          class="mt-0.5"
          :model-value="selectedChoices.includes(option)"
          @update:model-value="(checked) => toggleChoice(option, checked === true)"
        />
        <label :for="`${field.code}-${option}`" class="cursor-pointer text-sm">{{ option }}</label>
      </div>
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
