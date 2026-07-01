<script setup lang="ts">
// Barra superior de cada página da área clínica: título/breadcrumb à esquerda,
// ações à direita — espelha o topo das telas do PDF.
defineProps<{ title?: string }>()
</script>

<template>
  <header
    class="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-8 backdrop-blur"
  >
    <div class="flex min-w-0 items-center gap-2">
      <slot name="title">
        <span class="truncate text-sm font-medium text-foreground">{{ title }}</span>
      </slot>
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
