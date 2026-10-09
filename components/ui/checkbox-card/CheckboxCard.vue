<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

// Checkbox em cartão inteiro clicável (protótipo: termos do cadastro). Título
// e apoio ficam no <label>, então clicar em qualquer ponto do cartão marca.
const props = defineProps<{
  id: string
  title: string
  description?: string
  invalid?: boolean
  disabled?: boolean
  class?: HTMLAttributes["class"]
}>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label
    :for="id"
    :class="cn(
      'flex w-full cursor-pointer items-start gap-3 rounded-xl border bg-card p-3.5 text-left transition-colors duration-200 hover:border-input-hover',
      model && 'border-selected-border bg-surface-subtle hover:border-selected-border',
      invalid && !model && 'border-destructive',
      disabled && 'cursor-not-allowed opacity-50',
      props.class,
    )"
  >
    <Checkbox
      :id="id"
      class="mt-px size-[22px]"
      :model-value="model"
      :disabled="disabled"
      :aria-invalid="invalid || undefined"
      :aria-describedby="description ? `${id}-description` : undefined"
      @update:model-value="(checked) => (model = checked === true)"
    />
    <span class="flex min-w-0 flex-col gap-0.5">
      <span class="text-[15px] font-medium text-foreground">{{ title }}</span>
      <span v-if="description" :id="`${id}-description`" class="text-[13px] text-muted-foreground">{{ description }}</span>
    </span>
  </label>
</template>
