<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import type { AvatarVariants } from "."
import { AvatarRoot } from "reka-ui"
import { cn } from "@/lib/utils"
import { avatarVariant } from "."

const props = withDefaults(defineProps<{
  class?: HTMLAttributes["class"]
  size?: AvatarVariants["size"]
  shape?: AvatarVariants["shape"]
  tone?: AvatarVariants["tone"]
}>(), {
  size: "sm",
  shape: "circle",
})
</script>

<template>
  <AvatarRoot :class="cn(avatarVariant({ size, shape, tone }), props.class)">
    <slot />
  </AvatarRoot>
</template>
