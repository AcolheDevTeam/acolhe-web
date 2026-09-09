<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CalendarDate, type DateValue, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { CalendarRoot } from 'reka-ui'
import { CalendarIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarNextButton,
  CalendarPrevButton,
} from '@/components/ui/calendar'

// Seletor de data do projeto (substitui <input type="date">). Valor no formato
// ISO "YYYY-MM-DD" ou "" quando vazio. Mês e ano são escolhidos por dropdowns
// pesquisáveis para não obrigar a navegar mês a mês (ex.: data de nascimento).
// Atributos extras vão para o botão gatilho, então funciona dentro de <FormControl>.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  /** Menor data selecionável, "YYYY-MM-DD". Padrão 1900-01-01. */
  minDate?: string
  /** Maior data selecionável, "YYYY-MM-DD". Padrão: hoje + 10 anos. */
  maxDate?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  modelValue: '',
  placeholder: 'Selecione uma data',
  minDate: '1900-01-01',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const LOCALE = 'pt-BR'
const open = ref(false)

const todayDate = today(getLocalTimeZone())
const minValue = computed(() => parseDate(props.minDate))
const maxValue = computed(() => (props.maxDate ? parseDate(props.maxDate) : todayDate.add({ years: 10 })))

const value = computed<DateValue | undefined>(() => (props.modelValue ? parseDate(props.modelValue) : undefined))

// Mês exibido no calendário. Começa na data escolhida ou em hoje (limitado ao intervalo).
function clampToRange(date: DateValue): DateValue {
  if (date.compare(minValue.value) < 0) return minValue.value
  if (date.compare(maxValue.value) > 0) return maxValue.value
  return date
}
const placeholderDate = shallowRef<DateValue>(clampToRange(value.value ?? todayDate))
watch(value, (v) => { if (v) placeholderDate.value = v })

function onUpdate(date: DateValue | undefined) {
  emit('update:modelValue', date ? date.toString() : '')
  open.value = false
}

const monthFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'long' })
const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, index) => {
    const label = monthFormatter.format(new Date(2000, index, 1))
    return { value: String(index + 1), label: label.charAt(0).toUpperCase() + label.slice(1) }
  }),
)
// Anos do mais recente ao mais antigo, sempre dentro do intervalo permitido.
const yearOptions = computed(() => {
  const years = []
  for (let year = maxValue.value.year; year >= minValue.value.year; year--) {
    years.push({ value: String(year), label: String(year) })
  }
  return years
})

const selectedMonth = computed(() => String(placeholderDate.value.month))
const selectedYear = computed(() => String(placeholderDate.value.year))

function jumpTo(year: number, month: number) {
  placeholderDate.value = clampToRange(new CalendarDate(year, month, 1))
}

const displayFormatter = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' })
const displayValue = computed(() =>
  value.value ? displayFormatter.format(value.value.toDate(getLocalTimeZone())) : '',
)
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child :disabled="disabled">
      <button
        type="button"
        :disabled="disabled"
        v-bind="$attrs"
        :class="cn(
          'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          !displayValue && 'text-muted-foreground',
          props.class,
        )"
      >
        <span class="truncate text-start">{{ displayValue || placeholder }}</span>
        <CalendarIcon class="size-4 shrink-0 opacity-50" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-[19.5rem] max-w-[calc(100vw-2rem)] p-0">
      <CalendarRoot
        v-slot="{ grid, weekDays }"
        v-model:placeholder="placeholderDate"
        :model-value="value"
        :locale="LOCALE"
        :min-value="minValue"
        :max-value="maxValue"
        weekday-format="short"
        fixed-weeks
        class="p-3"
        @update:model-value="onUpdate"
      >
        <CalendarHeader class="gap-2">
          <CalendarPrevButton class="shrink-0" />
          <div class="flex min-w-0 flex-1 gap-2">
            <CustomDropdown
              :model-value="selectedMonth"
              :options="monthOptions"
              search-placeholder="Mês…"
              class="h-8 min-w-0 flex-1 px-2"
              content-class="w-40"
              aria-label="Mês"
              @update:model-value="(month) => jumpTo(placeholderDate.year, Number(month))"
            />
            <CustomDropdown
              :model-value="selectedYear"
              :options="yearOptions"
              search-placeholder="Ano…"
              class="h-8 w-24 shrink-0 px-2"
              content-class="w-28"
              aria-label="Ano"
              @update:model-value="(year) => jumpTo(Number(year), placeholderDate.month)"
            />
          </div>
          <CalendarNextButton class="shrink-0" />
        </CalendarHeader>

        <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="mt-3">
          <CalendarGridHead>
            <CalendarGridRow>
              <CalendarHeadCell v-for="day in weekDays" :key="day" class="w-auto flex-1 capitalize">
                {{ day.replace('.', '') }}
              </CalendarHeadCell>
            </CalendarGridRow>
          </CalendarGridHead>
          <CalendarGridBody>
            <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`week-${index}`" class="mt-1 w-full">
              <CalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate" class="flex-1">
                <CalendarCellTrigger :day="weekDate" :month="month.value" class="w-full" />
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarRoot>
    </PopoverContent>
  </Popover>
</template>
