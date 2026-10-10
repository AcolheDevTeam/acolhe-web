<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

// Interruptor do protótipo (44×26, botão de 20px): consentimentos e preferências.
// `size="lg"` é o da paciente (48×28, botão de 22px).
const props = defineProps<SwitchRootProps & { class?: HTMLAttributes["class"], size?: "default" | "lg" }>()
const emits = defineEmits<SwitchRootEmits>()
const delegatedProps = reactiveOmit(props, "class", "size")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SwitchRoot
    v-bind="forwarded"
    :class="cn(
      'peer inline-flex shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      size === 'lg' ? 'h-7 w-12' : 'h-[26px] w-11',
      props.class,
    )"
  >
    <SwitchThumb
      :class="cn(
        'pointer-events-none block rounded-full bg-white shadow-[0_1px_2px_rgba(22,26,58,.2)] transition-transform duration-300 ease-out data-[state=unchecked]:translate-x-0',
        size === 'lg' ? 'size-[22px] data-[state=checked]:translate-x-5' : 'size-5 data-[state=checked]:translate-x-[18px]',
      )"
    />
  </SwitchRoot>
</template>
