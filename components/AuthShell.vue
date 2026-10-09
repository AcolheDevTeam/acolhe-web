<script setup lang="ts">
// Moldura das telas de acesso sem ilustração (Recuperar senha): painel da marca
// com título e apoio à esquerda, conteúdo à direita. No celular, empilha.
defineProps<{ heading: string, support?: string }>()
</script>

<template>
  <main class="flex min-h-dvh flex-wrap bg-background md:h-dvh md:flex-nowrap">
    <section class="flex min-h-[280px] flex-[1_1_480px] flex-col justify-between gap-6 bg-secondary px-6 py-8 md:min-h-0 md:px-14 md:py-12">
      <NuxtLink to="/login" class="animate-rise self-start" aria-label="Acolhe, voltar para o login">
        <AppLogo :size="28" />
      </NuxtLink>
      <div class="animate-rise flex flex-col gap-4 [animation-delay:.15s]">
        <h2 class="max-w-[440px] text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] text-brand md:text-[38px]">{{ heading }}</h2>
        <p v-if="support" class="max-w-[400px] text-[15px] leading-relaxed text-secondary-foreground">{{ support }}</p>
      </div>
    </section>
    <section class="flex flex-[1_1_480px] items-center justify-center px-6 py-14 md:overflow-y-auto md:py-8">
      <div class="w-full max-w-[400px]">
        <slot />
      </div>
    </section>
  </main>
</template>
