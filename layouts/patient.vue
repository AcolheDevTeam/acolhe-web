<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'
import type { User } from '~/types'
import { Button } from '@/components/ui/button'
import { logoutRedirect } from '~/utils/patient-portal'

const { data: user } = await useFetch<User | null>('/api/me', { key: 'me' })
const isLoggingOut = ref(false)

async function logout() {
  isLoggingOut.value = true
  await $fetch('/api/logout', { method: 'POST' })
  await navigateTo(logoutRedirect())
}
</script>

<template>
  <div class="min-h-dvh bg-background pb-20 text-foreground md:pb-0">
    <header class="border-b bg-card/70">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 md:px-8">
        <NuxtLink to="/patient" aria-label="Ir para início do paciente"><AppLogo /></NuxtLink>
        <div class="flex items-center gap-3">
          <span class="hidden text-sm text-muted-foreground sm:inline">{{ user?.patient?.fullName }}</span>
          <Button variant="ghost" size="icon" :disabled="isLoggingOut" aria-label="Sair" @click="logout">
            <LogOut class="size-4" />
          </Button>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-5 py-7 md:px-8 md:py-10">
      <slot />
    </main>
    <nav class="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 px-5 py-3 backdrop-blur md:hidden" aria-label="Navegação do paciente">
      <div class="mx-auto flex max-w-md items-center justify-around text-xs text-muted-foreground">
        <NuxtLink to="/patient" class="flex flex-col items-center gap-1" active-class="font-medium text-foreground">
          <span aria-hidden="true">⌂</span><span>Início</span>
        </NuxtLink>
        <NuxtLink to="/patient#activities" class="flex flex-col items-center gap-1" active-class="font-medium text-foreground">
          <span aria-hidden="true">✓</span><span>Atividades</span>
        </NuxtLink>
        <NuxtLink to="/patient#check-in" class="flex flex-col items-center gap-1" active-class="font-medium text-foreground">
          <span aria-hidden="true">◌</span><span>Check-in</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
