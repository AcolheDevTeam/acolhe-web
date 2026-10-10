<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const { data: user } = await useFetch('/api/me', { key: 'me' })
const leaving = ref(false)

async function logout() {
  leaving.value = true
  await $fetch('/api/logout', { method: 'POST' }).catch(() => undefined)
  clearNuxtData('me')
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-dvh bg-background text-foreground">
    <header class="flex min-h-16 flex-wrap items-center gap-3 bg-[hsl(var(--brand))] px-4 py-3 text-white sm:px-6 lg:px-10">
      <NuxtLink to="/admin" class="flex items-center gap-2.5" aria-label="Acolhe Admin, início">
        <AppLogo :with-wordmark="false" on-dark />
        <span class="text-lg font-semibold tracking-[-0.02em]">Acolhe <span class="font-normal text-[#A9B2E8]">· Admin</span></span>
      </NuxtLink>
      <span class="rounded-full bg-[#FF8A70]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-[#FF8A70]">Ambiente interno</span>
      <div class="ml-auto flex items-center gap-2 sm:gap-4">
        <span class="hidden text-sm text-[#C3CAF0] sm:inline">{{ user?.name || user?.email }}</span>
        <Button variant="ghost" size="sm" class="text-white hover:bg-white/10 hover:text-white" :disabled="leaving" @click="logout">
          <LogOut class="size-4" aria-hidden="true" />
          <span class="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
    <slot />
  </div>
</template>
