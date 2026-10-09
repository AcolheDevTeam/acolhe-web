<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Confirmação inline perto da ação (o protótipo não usa toast flutuante para
// sucesso). Erros de API continuam no Sonner (A6).
const props = withDefaults(defineProps<{
  tone?: "positive" | "warning" | "danger" | "neutral"
  class?: HTMLAttributes["class"]
}>(), {
  tone: "positive",
})

const notice = cva("animate-fade rounded-xl px-4 py-3 text-sm leading-relaxed", {
  variants: {
    tone: {
      positive: "bg-positive-soft text-positive",
      warning: "bg-warning-soft text-warning",
      danger: "bg-destructive-soft text-destructive",
      neutral: "bg-secondary text-muted-foreground",
    },
  },
})
</script>

<template>
  <div
    :role="tone === 'danger' ? 'alert' : 'status'"
    :aria-live="tone === 'danger' ? 'assertive' : 'polite'"
    :class="cn(notice({ tone }), props.class)"
  >
    <slot />
  </div>
</template>
