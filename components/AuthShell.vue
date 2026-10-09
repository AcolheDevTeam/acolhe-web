<script setup lang="ts">
// Moldura das telas de acesso sem ilustração (Recuperar senha): painel da marca
// com título e apoio à esquerda, conteúdo à direita. No celular, empilha.
defineProps<{ heading: string, support?: string }>()
</script>

<template>
  <main class="flex min-h-dvh flex-wrap bg-background min-[900px]:h-dvh min-[900px]:flex-nowrap">
    <section class="hidden min-h-[280px] flex-[1_1_480px] flex-col justify-between gap-6 bg-secondary px-6 py-8 min-[900px]:flex min-[900px]:min-h-0 md:px-14 md:py-12">
      <NuxtLink to="/login" class="animate-rise self-start" aria-label="Acolhe, voltar para o login">
        <AppLogo :size="28" />
      </NuxtLink>
      <div class="animate-rise flex flex-col gap-4 [animation-delay:.15s]">
        <h2 class="max-w-[440px] text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] text-brand md:text-[38px]">{{ heading }}</h2>
        <p v-if="support" class="max-w-[400px] text-[15px] leading-relaxed text-secondary-foreground">{{ support }}</p>
      </div>
    </section>
    <section class="flex flex-[1_1_480px] justify-center px-6 py-8 min-[900px]:overflow-y-auto">
      <div class="my-auto w-full max-w-[400px]">
        <!-- No celular o painel da marca some: só o logo acima do conteúdo. -->
        <NuxtLink to="/login" class="mb-8 inline-flex min-[900px]:hidden" aria-label="Acolhe, voltar para o login">
          <AppLogo :size="28" />
        </NuxtLink>
        <slot />
      </div>
    </section>
  </main>
</template>
