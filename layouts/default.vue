<script setup lang="ts">
// Shell da área clínica: sidebar fixa + conteúdo. O /api/me roda server-side
// (proxy) — o token nunca chega ao browser (LGPD).
const { data: user } = await useFetch('/api/me', { key: 'me' })
</script>

<template>
  <div class="flex min-h-dvh bg-background">
    <AppSidebar :user="user as any" />
    <div class="flex min-w-0 flex-1 flex-col">
      <slot />
    </div>
  </div>
</template>
