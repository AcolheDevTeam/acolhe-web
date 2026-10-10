<script setup lang="ts">
import { Check, FileText } from 'lucide-vue-next'
import type { ActivityReviewField } from '~/schemas/activity'
import { Card } from '@/components/ui/card'

// Respostas de uma atividade, um card por campo na ordem do template (protótipo
// "Revisar"). Só leitura: serve à revisão da psicóloga e às respostas que a
// paciente já enviou.
defineProps<{ fields: ActivityReviewField[] }>()

function answerTypeLabel(type: string) {
  const labels: Record<string, string> = {
    long_text: 'Texto longo',
    short_text: 'Texto curto',
    text: 'Texto',
    scale: 'Escala',
    number: 'Número',
    boolean: 'Sim ou não',
    datetime: 'Data e hora',
    date: 'Data',
    multiple_choice: 'Múltipla escolha',
    single_choice: 'Escolha única',
    choice: 'Escolha',
    file: 'Arquivo',
  }
  return labels[type] ?? type
}

function jsonValues(value: unknown) {
  if (Array.isArray(value)) return value.map(String)
  if (value && typeof value === 'object') return [JSON.stringify(value)]
  return [String(value)]
}

// Escolhas: mostra todas as opções do template e destaca as marcadas, como no
// protótipo. Sem opções na config, só as marcadas aparecem.
function choiceOptions(config: Record<string, unknown>, value: unknown) {
  const marked = jsonValues(value)
  const options = Array.isArray(config.options) ? config.options.map(String) : []
  const list = options.length ? [...options, ...marked.filter(m => !options.includes(m))] : marked
  return list.map(label => ({ label, on: marked.includes(label) }))
}

// Escolha única chega como texto; com opções na config, vira pílulas também.
function choicePills(field: ActivityReviewField) {
  if (field.kind === 'json') return choiceOptions(field.config, field.value)
  if (field.kind === 'text' && field.fieldType === 'single_choice' && Array.isArray(field.config.options)) {
    return choiceOptions(field.config, field.value)
  }
  return null
}

// Escala vira a fileira de valores com o escolhido destacado.
function scaleSteps(config: Record<string, unknown>) {
  const min = typeof config.min === 'number' ? config.min : 1
  const max = typeof config.max === 'number' ? config.max : 10
  if (max < min || max - min > 20) return []
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}
</script>

<template>
  <ol class="flex flex-col gap-3.5">
    <li v-for="(field, index) in fields" :key="field.fieldId">
      <Card
        class="animate-fade flex flex-col gap-2.5 p-5"
        :style="{ animationDelay: `${index * 60}ms` }"
      >
        <span class="label-mono tracking-[0.1em]">
          {{ String(index + 1).padStart(2, '0') }} · {{ answerTypeLabel(field.fieldType) }}
        </span>
        <h2 class="text-base font-semibold">{{ field.label }}</h2>

        <ul
          v-if="choicePills(field)"
          class="flex flex-wrap gap-2"
        >
          <li
            v-for="option in choicePills(field)"
            :key="option.label"
            class="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px]"
            :class="option.on ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'"
          >
            <Check v-if="option.on" class="size-3.5" aria-hidden="true" />
            {{ option.label }}
            <span class="sr-only">{{ option.on ? '(marcada)' : '(não marcada)' }}</span>
          </li>
        </ul>
        <p v-else-if="field.kind === 'text'" class="whitespace-pre-line break-words text-[15px] leading-relaxed">
          {{ field.value }}
        </p>
        <template v-else-if="field.kind === 'number'">
          <div
            v-if="field.fieldType === 'scale' && scaleSteps(field.config).length"
            role="img"
            :aria-label="`Valor ${field.value}${typeof field.config.max === 'number' ? ` de ${field.config.max}` : ''}`"
            class="flex gap-1"
          >
            <span
              v-for="n in scaleSteps(field.config)"
              :key="n"
              class="flex h-10 min-w-0 flex-1 items-center justify-center rounded-[9px] text-sm"
              :class="n === field.value ? 'bg-primary font-semibold text-primary-foreground' : 'bg-secondary text-muted-foreground'"
            >
              {{ n }}
            </span>
          </div>
          <p v-else class="text-[26px] font-semibold tracking-[-0.02em]">
            {{ field.value }}
            <span v-if="typeof field.config.max === 'number'" class="text-base font-normal text-muted-foreground">
              / {{ field.config.max }}
            </span>
          </p>
        </template>
        <p v-else-if="field.kind === 'boolean'" class="text-[15px]">
          {{ field.value ? 'Sim' : 'Não' }}
        </p>
        <p v-else-if="field.kind === 'datetime'" class="text-[15px]">
          {{ formatDateTime(field.value) }}
        </p>
        <div v-else-if="field.kind === 'attachment'" class="flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <FileText class="size-4" />
          {{ field.value.mimeType }} · {{ field.value.sizeBytes }} bytes
        </div>
      </Card>
    </li>
  </ol>
</template>
