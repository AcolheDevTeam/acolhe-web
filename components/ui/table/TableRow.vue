<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <tr :class="cn('border-b border-secondary transition-colors duration-200 hover:bg-surface-subtle data-[state=selected]:bg-accent', props.class)">
    <slot />
  </tr>
</template>
