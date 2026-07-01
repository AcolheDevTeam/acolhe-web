<script setup lang="ts">
const props = defineProps<{ value?: number }>()
const pct = computed(() => Math.max(0, Math.min(100, props.value ?? 0)))
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
      <div class="h-full rounded-full bg-primary" :style="{ width: `${pct}%` }" />
    </div>
    <span class="text-sm tabular-nums text-muted-foreground">
      {{ value == null ? '—' : `${pct}%` }}
    </span>
  </div>
</template>
