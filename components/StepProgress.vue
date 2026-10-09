<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

// Progresso de um fluxo em etapas (protótipo do cadastro: "Etapa 2 de 4" +
// barra + nomes das etapas). `current` começa em 0.
const props = defineProps<{
  steps: readonly string[]
  current: number
  /** Rótulo da lista para leitores de tela, ex.: "Etapas do cadastro". */
  label: string
  class?: HTMLAttributes['class']
}>()

const percent = computed(() => ((props.current + 1) / props.steps.length) * 100)
</script>

<template>
  <div :class="cn('flex flex-col gap-3.5', props.class)">
    <div class="flex items-baseline justify-between gap-3">
      <p class="label-mono text-xs">Etapa {{ current + 1 }} de {{ steps.length }}</p>
      <p class="text-[13px] text-muted-foreground">{{ steps[current] }}</p>
    </div>
    <Progress :model-value="percent" aria-hidden="true" class="[&>*]:duration-500 [&>*]:ease-[cubic-bezier(.2,.7,.2,1)]" />
    <ol :aria-label="label" class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }">
      <li
        v-for="(step, index) in steps"
        :key="step"
        class="truncate text-[13px] font-medium transition-colors duration-200"
        :class="index === current ? 'text-brand' : index < current ? 'text-primary' : 'text-placeholder'"
        :aria-current="index === current ? 'step' : undefined"
      >
        {{ index + 1 }}. {{ step }}
      </li>
    </ol>
  </div>
</template>
