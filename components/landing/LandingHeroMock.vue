<script setup lang="ts">
import { Check } from 'lucide-vue-next'

// Ilustração do produto feita de divs (sem imagem): o "Hoje" da psicóloga com
// a agenda e, por cima, o check-in da paciente no celular. Os nomes são
// fictícios e o bloco é decorativo (aria-hidden). Na carga, as linhas entram
// escalonadas, a confirmação aparece e as barras crescem; ao rolar, o celular
// flutua um pouco mais que o painel (parallax leve).
const appointments = [
  { time: '08:00', name: 'Clara M.', status: 'Realizada', tone: 'done' },
  { time: '09:30', name: 'Rafael T.', status: 'Confirmada', tone: 'confirmed' },
  { time: '11:00', name: 'Júlia A.', status: 'Confirmada', tone: 'confirmed' },
  { time: '14:00', name: 'Bruno S.', status: 'Agendada', tone: 'scheduled' },
] as const

const mood = [3, 4, 2, 4, 5, 4, 5]
const moodClass = ['bg-mood-1', 'bg-mood-2', 'bg-mood-3', 'bg-mood-4', 'bg-mood-5']

const root = ref<HTMLElement | null>(null)
let frame = 0
function onScroll() {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    const y = Math.min(window.scrollY, 900)
    root.value?.style.setProperty('--parallax', `${y}`)
  })
}
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div ref="root" aria-hidden="true" class="mock relative mx-auto w-full max-w-[540px] select-none pb-12 pr-8 sm:pr-20">
    <!-- Painel da psicóloga -->
    <div class="mock-panel">
      <div class="mock-in rounded-[20px] border bg-card p-4 shadow-[0_24px_60px_rgba(22,26,58,.10)] sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex flex-col gap-1">
            <p class="label-mono">Agenda · hoje</p>
            <p class="text-lg font-semibold tracking-[-0.02em] sm:text-xl">Bom dia, Ana.</p>
          </div>
          <span class="inline-flex h-[26px] items-center rounded-full bg-positive-soft px-2.5 text-xs font-medium text-positive">4 sessões</span>
        </div>

        <ul class="mt-4 flex flex-col gap-2 sm:mt-5">
          <li
            v-for="(item, index) in appointments"
            :key="item.time"
            class="mock-row flex items-center gap-2.5 rounded-xl border px-3 py-2.5 sm:gap-3"
            :class="index === 1 ? 'border-selected-border bg-surface-subtle' : 'border-border'"
            :style="{ animationDelay: `${0.35 + index * 0.09}s` }"
          >
            <span class="w-10 font-mono text-xs text-muted-foreground sm:w-11 sm:text-[13px]">{{ item.time }}</span>
            <span
              class="size-2 shrink-0 rounded-full"
              :class="{
                'bg-input-hover': item.tone === 'done',
                'bg-primary': item.tone === 'confirmed',
                'border-2 border-input-hover bg-card': item.tone === 'scheduled',
              }"
            />
            <span class="flex-1 truncate text-[13px] font-medium sm:text-sm">{{ item.name }}</span>
            <span
              class="inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium"
              :class="{
                'bg-secondary text-secondary-foreground': item.tone === 'done',
                'mock-pop bg-primary text-primary-foreground': item.tone === 'confirmed',
                'border-[1.5px] border-primary bg-card text-positive': item.tone === 'scheduled',
              }"
              :style="item.tone === 'confirmed' ? { animationDelay: `${0.9 + index * 0.25}s` } : undefined"
            >
              <Check v-if="item.tone === 'confirmed'" class="size-3" :stroke-width="2.6" />
              {{ item.status }}
            </span>
          </li>
        </ul>

        <div class="mock-row mt-4 rounded-xl bg-surface-subtle p-4 sm:mt-5" style="animation-delay: .75s">
          <p class="label-mono">Evolução · 08:00</p>
          <div class="mt-3 flex flex-col gap-2">
            <span class="mock-line h-2 w-[92%] rounded-full bg-secondary" style="animation-delay: 1s" />
            <span class="mock-line h-2 w-[78%] rounded-full bg-secondary" style="animation-delay: 1.1s" />
            <span class="mock-line h-2 w-[54%] rounded-full bg-secondary" style="animation-delay: 1.2s" />
          </div>
        </div>
      </div>
    </div>

    <!-- Celular da paciente -->
    <div class="mock-phone-wrap absolute -bottom-1 right-0 w-[156px] sm:w-[200px]">
      <div class="mock-phone rounded-[24px] border-[5px] border-brand bg-card p-3 shadow-[0_24px_60px_rgba(22,26,58,.22)] sm:p-3.5">
        <p class="label-mono text-[10px]">Check-in</p>
        <p class="mt-1 text-[13px] font-semibold leading-tight tracking-[-0.01em] sm:text-[15px]">Como você está hoje?</p>
        <div class="mt-3 grid grid-cols-5 gap-1 sm:gap-1.5">
          <span
            v-for="level in 5"
            :key="level"
            class="aspect-square rounded-md sm:rounded-lg"
            :class="[moodClass[level - 1], level === 4 && 'mock-choice ring-2 ring-primary ring-offset-2']"
          />
        </div>
        <p class="label-mono mt-3 text-[10px] sm:mt-4">Últimos 7 dias</p>
        <div class="mt-2 flex h-10 items-end gap-1 sm:h-12">
          <span
            v-for="(value, index) in mood"
            :key="index"
            class="mock-bar flex-1 rounded-sm"
            :class="moodClass[value - 1]"
            :style="{ height: `${value * 20}%`, animationDelay: `${0.9 + index * 0.07}s` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mock { --parallax: 0; }
.mock-panel {
  transform: translateY(calc(var(--parallax) * -0.04px));
  will-change: transform;
}
.mock-phone-wrap {
  transform: translateY(calc(var(--parallax) * -0.12px));
  will-change: transform;
}
.mock-in {
  animation: rise .9s var(--ease-out) .1s both;
}
.mock-row {
  animation: row-in .6s var(--ease-out) both;
}
.mock-pop {
  animation: pop .5s var(--ease-out) both;
}
.mock-line {
  transform-origin: left;
  animation: line-in .8s var(--ease-out) both;
}
.mock-phone {
  animation: phone-in 1s var(--ease-out) .5s both, phone-float 7s ease-in-out 1.8s infinite;
}
.mock-choice {
  animation: pop .45s var(--ease-out) 1.4s both;
}
.mock-bar {
  transform-origin: bottom;
  animation: bar-grow .7s var(--ease-out) both;
}
@keyframes row-in {
  from { opacity: 0; transform: translateX(-14px); }
  to { opacity: 1; transform: none; }
}
@keyframes pop {
  0% { opacity: 0; transform: scale(.6); }
  60% { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes line-in {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes phone-in {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: none; }
}
@keyframes phone-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes bar-grow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
</style>
