<script setup lang="ts">
import type { NuxtError } from '#app'
import { LogIn } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

// Tela de erro do protótipo (Erro): logo esmaecido, código mono, título e uma
// ação. 404 e 401 têm texto próprio; o resto cai em "algo deu errado".
const props = defineProps<{ error: NuxtError }>()

const status = computed(() => props.error.statusCode ?? 500)
const kind = computed(() => status.value === 404 ? 'not-found' : status.value === 401 ? 'expired' : 'server')
const retrying = ref(false)

useHead({ title: computed(() => kind.value === 'not-found' ? 'Página não encontrada · Acolhe' : 'Erro · Acolhe') })

function goHome() {
  clearError({ redirect: '/' })
}
function signIn() {
  clearError({ redirect: '/login' })
}
async function retry() {
  retrying.value = true
  await clearError()
  reloadNuxtApp()
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background px-4 py-8 text-foreground md:px-12">
    <header>
      <a href="/" class="inline-flex" aria-label="Acolhe, ir para o início"><AppLogo :size="22" /></a>
    </header>

    <main class="flex flex-1 items-center justify-center py-12">
      <div class="animate-fade flex max-w-[460px] flex-col items-center gap-[18px] text-center">
        <template v-if="kind === 'expired'">
          <div aria-hidden="true" class="flex size-[72px] items-center justify-center rounded-full bg-accent text-primary">
            <LogIn class="size-7" :stroke-width="1.7" />
          </div>
          <h1 class="text-[32px] font-semibold tracking-[-0.03em]">Sua sessão foi encerrada</h1>
          <p class="text-[15px] leading-relaxed text-secondary-foreground">
            Por segurança, entre de novo para continuar. O que estava salvo continua salvo.
          </p>
          <Button size="xl" @click="signIn">Entrar de novo</Button>
        </template>

        <template v-else>
          <!-- Logo esmaecido do protótipo. -->
          <svg class="logo-faded" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
            <path pathLength="1" d="M22 17a10 10 0 0 0-20 0" stroke="hsl(var(--mood-2))" />
            <path pathLength="1" d="M18 17a6 6 0 0 0-12 0" stroke="#FFC2B4" />
            <path pathLength="1" d="M14 17a2 2 0 0 0-4 0" stroke="hsl(var(--mood-3))" />
          </svg>
          <p class="font-mono text-xs tracking-[.14em] text-muted-foreground">ERRO {{ status }}</p>
          <template v-if="kind === 'not-found'">
            <h1 class="text-[32px] font-semibold tracking-[-0.03em]">Página não encontrada</h1>
            <p class="text-[15px] leading-relaxed text-secondary-foreground">
              O endereço pode estar errado, ou a página foi removida. Se você chegou aqui por um link do Acolhe, avise o suporte.
            </p>
            <Button size="xl" @click="goHome">Voltar para o início</Button>
          </template>
          <template v-else>
            <h1 class="text-[32px] font-semibold tracking-[-0.03em]">Algo deu errado do nosso lado</h1>
            <p class="text-[15px] leading-relaxed text-secondary-foreground">
              Nenhum dado foi perdido. Tente de novo em alguns segundos. Se continuar, avise o suporte.
            </p>
            <div class="flex flex-wrap justify-center gap-2">
              <Button size="xl" :loading="retrying" @click="retry">{{ retrying ? 'Tentando…' : 'Tentar de novo' }}</Button>
              <Button size="xl" variant="outline" @click="goHome">Voltar para o início</Button>
            </div>
          </template>
        </template>
      </div>
    </main>
  </div>
</template>

<style scoped>
.logo-faded path {
  stroke-dasharray: 1;
  animation: arcdraw 1s cubic-bezier(.65, 0, .35, 1) backwards;
}
.logo-faded path:nth-child(2) { animation-delay: .25s; }
.logo-faded path:nth-child(3) { animation-delay: .5s; }
</style>
