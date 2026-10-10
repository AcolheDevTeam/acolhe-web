<script setup lang="ts">
import type { AccordionTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ChevronDown } from "lucide-vue-next"
import { AccordionHeader, AccordionTrigger } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<AccordionTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      v-bind="delegatedProps"
      :class="cn(
        'flex flex-1 items-center justify-between gap-4 rounded-lg py-5 text-left text-base font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 [&[data-state=open]>svg]:rotate-180',
        props.class,
      )"
    >
      <slot />
      <slot name="icon">
        <ChevronDown class="size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(.2,.7,.2,1)]" aria-hidden="true" />
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>
