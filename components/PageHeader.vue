<script setup lang="ts">
// Cabeçalho das páginas da área clínica (protótipo): eyebrow mono + H1 à
// esquerda, ações à direita, alinhadas pela base. Não é fixo. Telas de detalhe
// usam o slot `title` como breadcrumb no lugar do H1.
defineProps<{ title?: string, eyebrow?: string, description?: string }>()
</script>

<template>
  <header class="animate-rise flex flex-wrap items-end justify-between gap-4 px-4 pt-6 md:px-8 md:pt-7 lg:px-12">
    <div class="flex min-w-0 flex-1 basis-72 flex-col gap-2">
      <div v-if="$slots.title" class="flex min-h-9 min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
        <slot name="title" />
      </div>
      <template v-else>
        <p v-if="eyebrow" class="label-mono text-xs">{{ eyebrow }}</p>
        <h1 class="text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[34px]">{{ title }}</h1>
        <p v-if="description" class="max-w-2xl text-sm leading-relaxed text-muted-foreground">{{ description }}</p>
      </template>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
