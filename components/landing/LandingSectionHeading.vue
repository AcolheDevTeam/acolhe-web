<script setup lang="ts">
// Cabeçalho de seção da landing: rótulo mono, título e apoio opcional.
withDefaults(defineProps<{
  eyebrow: string
  title: string
  support?: string
  id?: string
  align?: 'left' | 'center'
  tone?: 'default' | 'brand'
}>(), { align: 'left', tone: 'default' })
</script>

<template>
  <div
    data-reveal
    class="flex max-w-[680px] flex-col gap-4"
    :class="align === 'center' && 'mx-auto items-center text-center'"
  >
    <p class="label-mono text-xs" :class="tone === 'brand' && '!text-highlight'">{{ eyebrow }}</p>
    <h2
      :id="id"
      class="text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[40px]"
      :class="tone === 'brand' ? 'text-white' : 'text-foreground'"
    >{{ title }}</h2>
    <p
      v-if="support"
      class="text-base leading-relaxed md:text-[17px]"
      :class="tone === 'brand' ? 'text-[#C3CAF0]' : 'text-secondary-foreground'"
    >{{ support }}</p>
  </div>
</template>
