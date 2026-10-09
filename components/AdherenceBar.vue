<script setup lang="ts">
// Barra de adesão do protótipo: 96px, abaixo de 65% fica em coral.
const props = defineProps<{ value?: number }>()
const pct = computed(() => Math.max(0, Math.min(100, props.value ?? 0)))
</script>

<template>
  <div class="flex items-center gap-2.5">
    <div class="h-1.5 w-24 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
      <div class="h-full rounded-full" :class="pct < 65 ? 'bg-alert' : 'bg-primary'" :style="{ width: `${pct}%` }" />
    </div>
    <span class="font-mono text-[13px] text-secondary-foreground">
      {{ value == null ? '—' : `${pct}%` }}
    </span>
  </div>
</template>
