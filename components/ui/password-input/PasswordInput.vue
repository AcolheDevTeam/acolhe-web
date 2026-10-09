<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { Eye, EyeOff } from "lucide-vue-next"
import { ref } from "vue"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

// Campo de senha com botão de mostrar/ocultar (protótipo). Atributos extras
// (id, autocomplete, aria-*) vão para o <input>.
defineOptions({ inheritAttrs: false })
const props = defineProps<{ class?: HTMLAttributes["class"] }>()
const model = defineModel<string | number>()
const visible = ref(false)
</script>

<template>
  <div :class="cn('relative', props.class)">
    <Input v-model="model" v-bind="$attrs" :type="visible ? 'text' : 'password'" class="pr-12" />
    <button
      type="button"
      class="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      :aria-label="visible ? 'Ocultar senha' : 'Mostrar senha'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" class="size-[18px]" />
      <Eye v-else class="size-[18px]" />
    </button>
  </div>
</template>
