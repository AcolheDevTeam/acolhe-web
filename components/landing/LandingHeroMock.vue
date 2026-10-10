<script setup lang="ts">
// Ilustração do produto feita de divs (sem imagem): o "Hoje" da psicóloga com
// a agenda e, por cima, o check-in da paciente no celular. Os nomes são
// fictícios e o bloco é decorativo (aria-hidden).
const appointments = [
  { time: '08:00', name: 'Clara M.', status: 'Realizada', tone: 'done' },
  { time: '09:30', name: 'Rafael T.', status: 'Confirmada', tone: 'confirmed' },
  { time: '11:00', name: 'Júlia A.', status: 'Confirmada', tone: 'confirmed' },
  { time: '14:00', name: 'Bruno S.', status: 'Agendada', tone: 'scheduled' },
] as const

const mood = [3, 4, 2, 4, 5, 4, 5]
const moodClass = ['bg-mood-1', 'bg-mood-2', 'bg-mood-3', 'bg-mood-4', 'bg-mood-5']
</script>

<template>
  <div aria-hidden="true" class="relative mx-auto w-full max-w-[560px] select-none pb-10 pr-6 sm:pr-16">
    <!-- Painel da psicóloga -->
    <div class="mock-float rounded-[20px] border bg-card p-5 shadow-[0_24px_60px_rgba(22,26,58,.10)] sm:p-6">
      <div class="flex items-center justify-between gap-3">
        <div class="flex flex-col gap-1">
          <p class="label-mono">Agenda · hoje</p>
          <p class="text-xl font-semibold tracking-[-0.02em]">Bom dia, Ana.</p>
        </div>
        <span class="inline-flex h-[26px] items-center rounded-full bg-positive-soft px-2.5 text-xs font-medium text-positive">4 sessões</span>
      </div>

      <ul class="mt-5 flex flex-col gap-2">
        <li
          v-for="item in appointments"
          :key="item.time"
          class="flex items-center gap-3 rounded-xl border px-3 py-2.5"
          :class="item.tone === 'confirmed' && item.time === '09:30' ? 'border-selected-border bg-surface-subtle' : 'border-border'"
        >
          <span class="w-11 font-mono text-[13px] text-muted-foreground">{{ item.time }}</span>
          <span
            class="size-2 shrink-0 rounded-full"
            :class="{
              'bg-input-hover': item.tone === 'done',
              'bg-primary': item.tone === 'confirmed',
              'border-2 border-input-hover bg-card': item.tone === 'scheduled',
            }"
          />
          <span class="flex-1 truncate text-sm font-medium">{{ item.name }}</span>
          <span
            class="inline-flex h-6 items-center rounded-full px-2 text-[11px] font-medium"
            :class="{
              'bg-secondary text-secondary-foreground': item.tone === 'done',
              'bg-primary text-primary-foreground': item.tone === 'confirmed',
              'border-[1.5px] border-primary bg-card text-positive': item.tone === 'scheduled',
            }"
          >{{ item.status }}</span>
        </li>
      </ul>

      <div class="mt-5 rounded-xl bg-surface-subtle p-4">
        <p class="label-mono">Evolução · 08:00</p>
        <div class="mt-3 flex flex-col gap-2">
          <span class="h-2 w-[92%] rounded-full bg-secondary" />
          <span class="h-2 w-[78%] rounded-full bg-secondary" />
          <span class="h-2 w-[54%] rounded-full bg-secondary" />
        </div>
      </div>
    </div>

    <!-- Celular da paciente -->
    <div class="mock-phone absolute -bottom-2 right-0 w-[176px] rounded-[26px] border-[5px] border-brand bg-card p-3.5 shadow-[0_24px_60px_rgba(22,26,58,.22)] sm:w-[200px]">
      <p class="label-mono text-[10px]">Check-in</p>
      <p class="mt-1 text-[15px] font-semibold leading-tight tracking-[-0.01em]">Como você está hoje?</p>
      <div class="mt-3 grid grid-cols-5 gap-1.5">
        <span
          v-for="level in 5"
          :key="level"
          class="aspect-square rounded-lg"
          :class="[moodClass[level - 1], level === 4 && 'ring-2 ring-primary ring-offset-2']"
        />
      </div>
      <p class="label-mono mt-4 text-[10px]">Últimos 7 dias</p>
      <div class="mt-2 flex h-12 items-end gap-1">
        <span
          v-for="(value, index) in mood"
          :key="index"
          class="mock-bar flex-1 rounded-sm"
          :class="moodClass[value - 1]"
          :style="{ height: `${value * 20}%`, animationDelay: `${0.6 + index * 0.06}s` }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mock-float {
  animation: rise .9s var(--ease-out) .15s both;
}
.mock-phone {
  animation: phone-in 1s var(--ease-out) .45s both, phone-float 7s ease-in-out 1.6s infinite;
}
.mock-bar {
  transform-origin: bottom;
  animation: bar-grow .7s var(--ease-out) both;
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
