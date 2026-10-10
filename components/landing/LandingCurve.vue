<script setup lang="ts">
// Transição entre seções no desenho do arco do logo: uma curva suave na cor da
// seção seguinte (`currentColor`). `flip` vira a curva para baixo.
defineProps<{ flip?: boolean }>()
</script>

<template>
  <svg
    aria-hidden="true"
    class="block h-10 w-full md:h-16"
    :class="flip && 'rotate-180'"
    viewBox="0 0 1440 64"
    preserveAspectRatio="none"
  >
    <path d="M0 64 C 360 0 1080 0 1440 64 Z" fill="currentColor" />
  </svg>
</template>
