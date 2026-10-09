<script setup lang="ts">
import type { TabsTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    v-bind="forwardedProps"
    :class="cn(
      // Segmentado do protótipo: pílula branca sobre trilho claro.
      'inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium text-muted-foreground transition-[background-color,color,box-shadow] duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-[0_1px_2px_rgba(22,26,58,.1)]',
      props.class,
    )"
  >
    <span class="truncate">
      <slot />
    </span>
  </TabsTrigger>
</template>
