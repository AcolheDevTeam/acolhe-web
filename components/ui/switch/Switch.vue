<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

// Interruptor do protótipo (44×26, botão de 20px): consentimentos e preferências.
const props = defineProps<SwitchRootProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<SwitchRootEmits>()
const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SwitchRoot
    v-bind="forwarded"
    :class="cn(
      'peer inline-flex h-[26px] w-11 shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      props.class,
    )"
  >
    <SwitchThumb class="pointer-events-none block size-5 rounded-full bg-white shadow-[0_1px_2px_rgba(22,26,58,.2)] transition-transform duration-300 ease-out data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0" />
  </SwitchRoot>
</template>
