<script setup lang="ts">
// Símbolo do Acolhe: três arcos (índigo, salmão e a cor do texto). Com
// `animated`, os arcos aparecem um de cada vez, como no login do protótipo.
withDefaults(defineProps<{ withWordmark?: boolean, size?: number, animated?: boolean, onDark?: boolean }>(), {
  withWordmark: true,
  size: 24,
  animated: false,
  onDark: false,
})
</script>

<template>
  <span class="flex items-center gap-2.5 text-foreground">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="onDark ? '#9DB0F5' : 'hsl(var(--primary))'"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
      :class="{ 'logo-animated': animated }"
    >
      <path pathLength="1" d="M22 17a10 10 0 0 0-20 0" />
      <path pathLength="1" d="M18 17a6 6 0 0 0-12 0" stroke="#FF7A5C" />
      <path pathLength="1" d="M14 17a2 2 0 0 0-4 0" :stroke="onDark ? '#FFFFFF' : 'currentColor'" />
    </svg>
    <span v-if="withWordmark" class="text-lg font-semibold tracking-[-0.02em]">Acolhe</span>
  </span>
</template>

<style scoped>
.logo-animated path {
  stroke-dasharray: 1;
  animation: arcdraw 1s cubic-bezier(.65, 0, .35, 1) backwards;
}
.logo-animated path:nth-child(1) { animation-delay: .2s; }
.logo-animated path:nth-child(2) { animation-delay: .45s; }
.logo-animated path:nth-child(3) { animation-delay: .7s; }
</style>
