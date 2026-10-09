<script setup lang="ts">
import type { TemplateFormValues } from '~/schemas/activity-template'

type FieldValues = NonNullable<TemplateFormValues['fields']>[number]

// "Como a paciente vê" do builder (protótipo): esboço do formulário a partir dos
// valores em edição. Só desenha a forma de cada resposta; não é interativo.
const props = defineProps<{
  title?: string
  instructions?: string
  fields: FieldValues[]
}>()

// Pontos da escala; se mínimo/máximo ainda estão inválidos, não desenha.
function scalePoints(field: FieldValues): number[] {
  const min = Number(field.min)
  const max = Number(field.max)
  if (!Number.isInteger(min) || !Number.isInteger(max) || max <= min || max - min > 20) return []
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}

function choiceOptions(field: FieldValues): string[] {
  if (field.fieldType === 'boolean') return ['Sim', 'Não']
  return (field.options ?? []).map((option, i) => option?.trim() || `Opção ${i + 1}`)
}

const boxClass: Partial<Record<string, string>> = {
  short_text: 'h-9',
  long_text: 'h-[72px]',
  date: 'h-9 max-w-[160px]',
  datetime: 'h-9 max-w-[200px]',
}

const rows = computed(() => props.fields.map((field, i) => ({
  num: i + 1,
  field,
  points: field.fieldType === 'scale' ? scalePoints(field) : [],
  options: ['single_choice', 'multiple_choice', 'boolean'].includes(field.fieldType ?? '') ? choiceOptions(field) : [],
  box: boxClass[field.fieldType ?? ''],
})))
</script>

<template>
  <section aria-labelledby="preview-title" class="flex flex-col gap-3.5 rounded-2xl bg-brand p-5 text-brand-foreground">
    <h2 id="preview-title" class="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-muted">Como a paciente vê</h2>
    <div class="flex flex-col gap-4 rounded-[14px] bg-card p-4 text-foreground">
      <div>
        <p class="text-base font-semibold" :class="!title && 'text-placeholder'">{{ title || 'Título do template' }}</p>
        <p v-if="instructions" class="mt-1 whitespace-pre-line text-[13px] text-muted-foreground">{{ instructions }}</p>
      </div>
      <p v-if="!rows.length" class="text-[13px] text-muted-foreground">Os campos aparecem aqui conforme você adiciona.</p>
      <div v-for="row in rows" :key="row.num" class="flex flex-col gap-1.5">
        <p class="text-sm font-medium">
          {{ row.num }}. {{ row.field.label || 'Pergunta sem texto' }}<span v-if="row.field.required !== false" class="text-warning" aria-label="obrigatória"> *</span>
        </p>
        <p v-if="row.field.helpText" class="text-xs text-muted-foreground">{{ row.field.helpText }}</p>
        <div v-if="row.box" class="rounded-lg border bg-surface-subtle" :class="row.box" />
        <template v-else-if="row.points.length">
          <div class="flex gap-1">
            <span
              v-for="n in row.points"
              :key="n"
              class="flex h-[30px] min-w-0 flex-1 items-center justify-center rounded-[7px] border bg-card text-xs text-secondary-foreground"
            >{{ n }}</span>
          </div>
          <div v-if="row.field.minLabel || row.field.maxLabel" class="flex justify-between gap-2 text-[11px] text-muted-foreground">
            <span>{{ row.field.minLabel }}</span>
            <span>{{ row.field.maxLabel }}</span>
          </div>
        </template>
        <div v-else-if="row.options.length" class="flex flex-wrap gap-1.5">
          <span
            v-for="(option, i) in row.options"
            :key="i"
            class="inline-flex h-7 items-center rounded-full border px-2.5 text-xs text-secondary-foreground"
          >{{ option }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
