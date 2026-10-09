<script setup lang="ts">
defineProps<{ label: string; value: string | number; hint?: string }>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="label-mono">{{ label }}</p>
    <p class="text-[32px] font-semibold leading-none tracking-[-0.03em]">{{ value }}</p>
    <p v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
