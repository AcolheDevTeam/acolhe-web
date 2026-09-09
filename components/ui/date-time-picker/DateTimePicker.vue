<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { CustomDropdown } from '@/components/ui/custom-dropdown'

// Seletor de data e hora do projeto (substitui <input type="datetime-local">).
// Valor: string ISO em UTC (ex.: "2026-09-09T17:00:00.000Z") ou "" quando
// incompleto. A data é escolhida no DatePicker e a hora em dois dropdowns
// pesquisáveis (hora e minuto), todos no fuso local do navegador.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string
  /** Menor data selecionável, "YYYY-MM-DD". */
  minDate?: string
  /** Maior data selecionável, "YYYY-MM-DD". */
  maxDate?: string
  /** Intervalo entre minutos oferecidos (1, 5, 10, 15, 30). */
  minuteStep?: number
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  modelValue: '',
  minuteStep: 5,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const pad = (n: number) => String(n).padStart(2, '0')

// Estado interno derivado do modelValue (fuso local).
const date = ref('')
const hour = ref('')
const minute = ref('')

function syncFromModel(iso: string) {
  if (!iso) {
    date.value = ''
    hour.value = ''
    minute.value = ''
    return
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return
  date.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  hour.value = pad(d.getHours())
  minute.value = pad(d.getMinutes())
}
watch(() => props.modelValue, syncFromModel, { immediate: true })

function emitIfComplete() {
  if (!date.value || !hour.value || !minute.value) {
    if (props.modelValue) emit('update:modelValue', '')
    return
  }
  const [y, m, d] = date.value.split('-').map(Number)
  const local = new Date(y!, m! - 1, d!, Number(hour.value), Number(minute.value), 0, 0)
  emit('update:modelValue', local.toISOString())
}

const hourOptions = Array.from({ length: 24 }, (_, h) => ({ value: pad(h), label: pad(h) }))
const minuteOptions = computed(() => {
  const step = Math.max(1, Math.min(60, Math.floor(props.minuteStep)))
  const options = []
  for (let m = 0; m < 60; m += step) options.push({ value: pad(m), label: pad(m) })
  // Garante que um minuto fora do passo (vindo de um valor existente) continue visível.
  if (minute.value && !options.some(o => o.value === minute.value)) {
    options.push({ value: minute.value, label: minute.value })
    options.sort((a, b) => a.value.localeCompare(b.value))
  }
  return options
})
</script>

<template>
  <div :class="cn('flex flex-col gap-2 sm:flex-row', props.class)">
    <DatePicker
      v-model="date"
      :min-date="minDate"
      :max-date="maxDate"
      :disabled="disabled"
      class="sm:flex-1"
      v-bind="$attrs"
      @update:model-value="emitIfComplete"
    />
    <div class="flex items-center gap-2">
      <CustomDropdown
        v-model="hour"
        :options="hourOptions"
        :disabled="disabled"
        placeholder="Hora"
        search-placeholder="Hora…"
        class="w-full sm:w-[5.5rem]"
        content-class="w-24"
        aria-label="Hora"
        @update:model-value="emitIfComplete"
      />
      <span class="text-sm text-muted-foreground">:</span>
      <CustomDropdown
        v-model="minute"
        :options="minuteOptions"
        :disabled="disabled"
        placeholder="Min"
        search-placeholder="Minuto…"
        class="w-full sm:w-[5.5rem]"
        content-class="w-24"
        aria-label="Minuto"
        @update:model-value="emitIfComplete"
      />
    </div>
  </div>
</template>
