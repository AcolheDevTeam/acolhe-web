<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

// Shell da área clínica: sidebar fixa no desktop; no celular vira um menu
// lateral aberto por botão. O /api/me roda server-side (proxy) — o token nunca
// chega ao browser (LGPD).
const { data: user } = await useFetch('/api/me', { key: 'me' })

const menuOpen = ref(false)
const route = useRoute()
// Fecha o menu ao navegar.
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <div class="flex min-h-dvh bg-background">
    <AppSidebar class="hidden md:flex" :user="user as any" />

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Barra superior só no celular -->
      <header class="flex h-14 items-center justify-between border-b bg-card/40 px-4 md:hidden">
        <NuxtLink to="/dashboard" aria-label="Ir para o início"><AppLogo /></NuxtLink>
        <Sheet v-model:open="menuOpen">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu class="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-64 p-0">
            <SheetTitle class="sr-only">Menu</SheetTitle>
            <AppSidebar class="w-full border-r-0" :user="user as any" />
          </SheetContent>
        </Sheet>
      </header>

      <slot />
    </div>
  </div>
</template>
