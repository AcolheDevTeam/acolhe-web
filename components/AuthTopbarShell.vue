<script setup lang="ts">
// Moldura das telas de acesso com coluna central (Cadastro, Verificar e-mail):
// logo à esquerda, ação à direita (#aside) e o conteúdo centralizado. A partir
// de md a página ocupa a altura da janela e só a área do conteúdo rola.
withDefaults(defineProps<{ width?: 'md' | 'lg', center?: boolean }>(), { width: 'lg', center: false })
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background md:h-dvh">
    <header class="animate-rise flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-5 sm:px-[clamp(16px,4vw,48px)] sm:py-6 [@media(max-height:700px)]:py-4">
      <NuxtLink to="/login" aria-label="Acolhe, voltar para o login" class="rounded-md">
        <AppLogo :size="28" class="[&>span]:text-xl" />
      </NuxtLink>
      <slot name="aside" />
    </header>
    <!-- O respiro de baixo fica no conteúdo, não no main: o padding do main
         empurraria para cima um rodapé sticky (bottom-0) das páginas. -->
    <main class="flex flex-1 flex-col px-4 pt-4 md:min-h-0 md:overflow-y-auto md:scroll-pb-28 [@media(max-height:700px)]:pt-0">
      <div
        class="mx-auto flex w-full flex-col pb-14 [@media(max-height:700px)]:pb-6"
        :class="[width === 'md' ? 'max-w-[480px]' : 'max-w-[560px]', center && 'my-auto']"
      >
        <slot />
      </div>
    </main>
  </div>
</template>
