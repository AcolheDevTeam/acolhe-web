<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from "."
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from "."

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
  /** Mostra o spinner e bloqueia o clique; o texto vem do slot ("Entrando…"). */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :disabled="loading || undefined"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="size-4 animate-spin rounded-full border-2 border-current/35 border-t-current" aria-hidden="true" />
    <slot />
  </Primitive>
</template>
