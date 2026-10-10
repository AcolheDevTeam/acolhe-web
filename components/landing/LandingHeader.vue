<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { activeSectionId } from '~/utils/landing'

// Topo fixo da landing: logo, âncoras das seções e acesso. Com sessão aberta,
// "Entrar" vira "Ir para o app". Ao rolar, encolhe um pouco, ganha borda e
// fundo translúcido, e o link da seção visível fica marcado (aria-current).
const props = defineProps<{
  links: { href: string, label: string }[]
  appHref?: string
}>()

const scrolled = ref(false)
const menuOpen = ref(false)
const active = ref<string>()
let frame = 0

function update() {
  frame = 0
  scrolled.value = window.scrollY > 8
  const sections = props.links.flatMap((link) => {
    const el = document.getElementById(link.href.slice(1))
    return el ? [{ id: link.href, top: el.getBoundingClientRect().top }] : []
  })
  // No fim da página a última seção pode não alcançar a linha: vale a última.
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  active.value = atBottom ? sections.at(-1)?.id : activeSectionId(sections, window.innerHeight * 0.35)
}
function onScroll() {
  if (!frame) frame = requestAnimationFrame(update)
}
onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300"
    :class="scrolled ? 'border-border bg-background/80 backdrop-blur-md backdrop-saturate-150' : 'border-transparent bg-transparent'"
  >
    <div
      class="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 md:h-[72px] md:px-8"
    >
      <NuxtLink to="/" aria-label="Acolhe, início" class="shrink-0 rounded-md">
        <AppLogo :size="26" />
      </NuxtLink>

      <nav aria-label="Seções" class="hidden flex-1 items-center justify-center gap-1 lg:flex">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          :aria-current="active === link.href ? 'true' : undefined"
          class="relative rounded-lg px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-surface-hover hover:text-foreground aria-[current]:text-foreground"
        >
          {{ link.label }}
          <span
            aria-hidden="true"
            class="absolute inset-x-3 -bottom-px h-0.5 origin-center rounded-full bg-primary transition-transform duration-300 ease-[cubic-bezier(.2,.7,.2,1)]"
            :class="active === link.href ? 'scale-x-100' : 'scale-x-0'"
          />
        </a>
      </nav>

      <div class="ml-auto flex items-center gap-2 lg:ml-0">
        <Button v-if="appHref" as-child variant="ghost" class="hidden sm:inline-flex">
          <NuxtLink :to="appHref">Ir para o app</NuxtLink>
        </Button>
        <Button v-else as-child variant="ghost" class="hidden sm:inline-flex">
          <NuxtLink to="/login">Entrar</NuxtLink>
        </Button>
        <Button as-child size="sm" class="sm:hidden">
          <NuxtLink :to="appHref ?? '/signup'">{{ appHref ? 'Ir para o app' : 'Teste grátis' }}</NuxtLink>
        </Button>
        <Button as-child class="hidden sm:inline-flex">
          <NuxtLink to="/signup">Começar teste grátis</NuxtLink>
        </Button>

        <Sheet v-model:open="menuOpen">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="lg:hidden" aria-label="Abrir menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" class="flex w-[300px] flex-col gap-8 p-6">
            <div class="flex flex-col gap-1">
              <SheetTitle class="sr-only">Menu</SheetTitle>
              <SheetDescription class="sr-only">Seções da página e acesso ao Acolhe.</SheetDescription>
              <AppLogo :size="24" />
            </div>
            <nav aria-label="Seções" class="flex flex-col">
              <a
                v-for="link in links"
                :key="link.href"
                :href="link.href"
                :aria-current="active === link.href ? 'true' : undefined"
                class="border-b py-3.5 text-base font-medium text-foreground aria-[current]:text-primary"
                @click="menuOpen = false"
              >{{ link.label }}</a>
            </nav>
            <div class="mt-auto flex flex-col gap-2.5">
              <Button as-child size="xl" class="w-full">
                <NuxtLink to="/signup">Começar teste grátis</NuxtLink>
              </Button>
              <Button as-child size="xl" variant="outline" class="w-full">
                <NuxtLink :to="appHref ?? '/login'">{{ appHref ? 'Ir para o app' : 'Entrar' }}</NuxtLink>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>
</template>
