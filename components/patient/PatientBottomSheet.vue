<script setup lang="ts">
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// Bottom sheet das telas da paciente (protótipo AjustesPaciente): sobe de baixo,
// raio só no topo, largura de celular também no desktop. O conteúdo e as ações
// vão no slot.
defineProps<{ open: boolean, title: string, description?: string }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <Sheet :open="open" @update:open="(value: boolean) => emit('update:open', value)">
    <SheetContent
      side="bottom"
      class="mx-auto flex max-h-[90dvh] max-w-lg flex-col gap-4 overflow-y-auto rounded-t-[22px] px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-3"
    >
      <span aria-hidden="true" class="mx-auto mb-1 h-1 w-10 rounded-full bg-input" />
      <SheetHeader class="gap-2 p-0 text-left">
        <SheetTitle class="pr-8 text-xl font-semibold tracking-[-0.02em]">{{ title }}</SheetTitle>
        <SheetDescription v-if="description" class="text-sm leading-relaxed text-secondary-foreground">{{ description }}</SheetDescription>
      </SheetHeader>
      <slot />
    </SheetContent>
  </Sheet>
</template>
