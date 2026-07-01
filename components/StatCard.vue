<script setup lang="ts">
defineProps<{ label: string; value: string | number; hint?: string }>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <p class="label-mono">{{ label }}</p>
    <p class="font-serif text-3xl leading-none">{{ value }}</p>
    <p v-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
