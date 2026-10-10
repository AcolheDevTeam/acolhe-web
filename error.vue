<script setup lang="ts">
import type { NuxtError } from '#app'
import { Lock, WifiOff } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

// Tela de erro do protótipo (Erro): 404, 500 com código copiável, sessão
// encerrada (401) e sem conexão. O resto cai em "algo deu errado".
const props = defineProps<{ error: NuxtError }>()

const status = computed(() => props.error.statusCode ?? 500)

// Sem conexão: o navegador diz que está offline ou o fetch nem chegou ao
// servidor. Só acontece no cliente (no SSR a página veio da rede).
const NETWORK_FAILURE = /failed to fetch|networkerror|load failed|network request failed/i
const offline = ref(import.meta.client && (!navigator.onLine || NETWORK_FAILURE.test(props.error.message ?? '')))

const kind = computed(() => {
  if (offline.value) return 'offline'
  if (status.value === 404) return 'not-found'
  if (status.value === 401) return 'expired'
  return 'server'
})

useHead({
  title: computed(() => ({
    'not-found': 'Página não encontrada · Acolhe',
    'expired': 'Sessão encerrada · Acolhe',
    'offline': 'Sem conexão · Acolhe',
    'server': 'Erro · Acolhe',
  })[kind.value]),
})

// Código para o suporte: status + data/hora UTC do erro. Não há ID de requisição
// na API, então é isso que permite achar o erro nos logs. O `useState` mantém o
// mesmo valor do SSR na hidratação; ao sair da tela ele é descartado.
const occurredAt = useState('error-occurred-at', () => new Date().toISOString())
onBeforeUnmount(() => clearNuxtState('error-occurred-at'))
const code = computed(() => {
  const [date = '', time = ''] = occurredAt.value.split('T')
  return `${status.value}-${date.replaceAll('-', '')}-${time.slice(0, 5).replace(':', '')}`
})

const route = useRoute()
const copyState = ref<'idle' | 'copied' | 'failed'>('idle')
let copyTimer: ReturnType<typeof setTimeout> | undefined
async function copyCode() {
  // Vai junto o caminho (sem query, que pode ter token de convite).
  try {
    await navigator.clipboard.writeText(`Código ${code.value} · ${route.path}`)
    copyState.value = 'copied'
  }
  catch {
    copyState.value = 'failed'
  }
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copyState.value = 'idle'), 1800)
}

const retrying = ref(false)
const stillOffline = ref(false)

// "/" agora é a landing pública; o painel decide o destino de cada papel.
function goHome() {
  clearError({ redirect: '/dashboard' })
}
async function retry() {
  retrying.value = true
  stillOffline.value = false
  if (kind.value === 'offline' && !navigator.onLine) {
    // Recarregar sem rede trocaria esta tela pela página de erro do navegador.
    setTimeout(() => {
      retrying.value = false
      stillOffline.value = true
    }, 800)
    return
  }
  await clearError()
  reloadNuxtApp()
}

onBeforeUnmount(() => clearTimeout(copyTimer))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background px-4 py-8 text-foreground md:px-12">
    <header>
      <a href="/" class="inline-flex" aria-label="Acolhe, ir para o início"><AppLogo :size="22" /></a>
    </header>

    <main class="flex flex-1 items-center justify-center py-12" aria-live="polite">
      <div :key="kind" class="animate-fade flex w-full max-w-[460px] flex-col items-center gap-[18px] text-center">
        <template v-if="kind === 'expired'">
          <div aria-hidden="true" class="flex size-[72px] items-center justify-center rounded-full bg-accent text-primary">
            <Lock class="size-8" :stroke-width="1.7" />
          </div>
          <h1 class="text-[32px] font-semibold leading-tight tracking-[-0.03em]">Sua sessão foi encerrada</h1>
          <p class="text-[15px] leading-relaxed text-secondary-foreground">
            Por segurança, entre de novo para continuar. O que estava salvo continua salvo.
          </p>
          <Button as-child size="xl">
            <a href="/login">Entrar de novo</a>
          </Button>
        </template>

        <template v-else-if="kind === 'offline'">
          <div aria-hidden="true" class="flex size-[72px] items-center justify-center rounded-full bg-warning-soft text-warning">
            <WifiOff class="size-8" :stroke-width="1.7" />
          </div>
          <h1 class="text-[32px] font-semibold leading-tight tracking-[-0.03em]">Sem conexão</h1>
          <p class="text-[15px] leading-relaxed text-secondary-foreground">
            Não foi possível falar com o Acolhe. Verifique sua internet e tente de novo.
          </p>
          <Button size="xl" variant="outline" :loading="retrying" @click="retry">
            {{ retrying ? 'Tentando…' : 'Tentar de novo' }}
          </Button>
          <p v-if="stillOffline" class="text-sm text-warning">Ainda sem conexão.</p>
        </template>

        <template v-else>
          <!-- Logo esmaecido do protótipo. -->
          <svg class="logo-faded" width="88" height="88" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
            <path pathLength="1" d="M22 17a10 10 0 0 0-20 0" stroke="hsl(var(--mood-2))" />
            <path pathLength="1" d="M18 17a6 6 0 0 0-12 0" stroke="#FFC2B4" />
            <path pathLength="1" d="M14 17a2 2 0 0 0-4 0" stroke="hsl(var(--mood-3))" />
          </svg>
          <p class="font-mono text-xs tracking-[.14em] text-muted-foreground">ERRO {{ status }}</p>
          <template v-if="kind === 'not-found'">
            <h1 class="text-[32px] font-semibold leading-tight tracking-[-0.03em]">Página não encontrada</h1>
            <p class="text-[15px] leading-relaxed text-secondary-foreground">
              O endereço pode estar errado, ou a página foi removida. Se você chegou aqui por um link do Acolhe, avise o suporte.
            </p>
            <Button size="xl" @click="goHome">Voltar para o início</Button>
          </template>
          <template v-else>
            <h1 class="text-[32px] font-semibold leading-tight tracking-[-0.03em]">Algo deu errado do nosso lado</h1>
            <p class="text-[15px] leading-relaxed text-secondary-foreground">
              Tente de novo em alguns segundos. Se continuar, envie o código abaixo para o suporte.
            </p>
            <div class="flex max-w-full items-center gap-2 rounded-lg border bg-card py-2 pl-3.5 pr-2">
              <span class="select-all font-mono text-[13px] text-secondary-foreground">Código: {{ code }}</span>
              <Button
                size="xs"
                variant="secondary"
                class="h-7 shrink-0 rounded-md bg-accent px-2.5 font-medium text-primary-hover hover:bg-accent"
                @click="copyCode"
              >
                {{ copyState === 'copied' ? 'Copiado' : copyState === 'failed' ? 'Selecione e copie' : 'Copiar' }}
              </Button>
            </div>
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
.logo-faded path:nth-child(1) { animation-delay: .1s; }
.logo-faded path:nth-child(2) { animation-delay: .3s; }
.logo-faded path:nth-child(3) { animation-delay: .5s; }
</style>
