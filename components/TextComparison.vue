<script setup lang="ts">
import { documentaryDiff } from '~/utils/documentary-diff'
const props = defineProps<{
  before: string
  after: string
  beforeLabel?: string
  afterLabel?: string
}>()
const diff = computed(() => documentaryDiff(props.before, props.after))
</script>
<template>
  <div class="space-y-3">
    <p v-if="before === after" class="text-sm text-muted-foreground">
      Os textos são idênticos.
    </p>
    <template v-else>
      <p class="text-xs text-muted-foreground">
        Trecho alterado entre os textos. Espaços e quebras de linha são
        preservados.
      </p>
      <div class="grid gap-4 md:grid-cols-2">
        <section class="min-w-0 rounded-lg border p-4">
          <h4 class="label-mono mb-3">{{ beforeLabel ?? 'Removido' }}</h4>
          <pre
            class="max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-sm"
            >{{ diff.removed || '(trecho vazio)' }}</pre
          >
        </section>
        <section class="min-w-0 rounded-lg border p-4">
          <h4 class="label-mono mb-3">{{ afterLabel ?? 'Adicionado' }}</h4>
          <pre
            class="max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-sm"
            >{{ diff.added || '(trecho vazio)' }}</pre
          >
        </section>
      </div>
    </template>
  </div>
</template>
