<script setup lang="ts">
import { Rainbow } from 'lucide-vue-next'

withDefaults(defineProps<{ withWordmark?: boolean }>(), {
  withWordmark: true,
})
</script>

<template>
  <span class="flex items-center gap-2 text-foreground">
    <Rainbow class="size-5" :stroke-width="1.75" />
    <span v-if="withWordmark" class="text-base font-semibold tracking-tight">Acolhe</span>
  </span>
</template>
