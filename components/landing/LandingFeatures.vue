<script setup lang="ts">
import { Building2, CalendarCheck, Check, FileLock2, ListChecks, LockKeyhole, NotebookPen, Smartphone, Smile } from 'lucide-vue-next'

// Recursos da landing em bento: três destaques com uma prévia da interface
// feita de divs (agenda, check-in, Registro Documental), dois blocos
// pequenos e dois largos. Só o que existe no produto hoje.
const small = [
  { icon: NotebookPen, title: 'Prontuário por sessão', text: 'Registre a evolução de cada atendimento. A ficha da paciente reúne as sessões em ordem.' },
  { icon: ListChecks, title: 'Atividades com templates', text: 'Monte tarefas e questionários uma vez e envie para quem precisar. As respostas chegam para você revisar.' },
  { icon: Smartphone, title: 'Área da paciente no celular', text: 'Nada para instalar. A paciente entra pelo navegador e vê sessões, atividades e o check-in do dia.' },
  { icon: Building2, title: 'Clínicas e equipes', text: 'Convide a equipe e acompanhe números agregados no painel. Cada psicóloga cuida dos próprios pacientes.' },
]

const week = [
  { day: 'Seg', time: '09:30', name: 'Rafael T.', confirmed: true },
  { day: 'Ter', time: '11:00', name: 'Júlia A.', confirmed: true },
  { day: 'Qui', time: '14:00', name: 'Bruno S.', confirmed: false },
]

const mood = [3, 3, 2, 4, 3, 4, 5, 4, 4, 5, 3, 4, 5, 5]
const moodClass = ['bg-mood-1', 'bg-mood-2', 'bg-mood-3', 'bg-mood-4', 'bg-mood-5']

const cipher = ['7f3a·c91e·04bd·e2a7', 'b8d0·5c6f·a113·9e4c', '2e7b·f0a9·61dc·38']
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
    <!-- Agenda -->
    <article data-reveal class="tile flex flex-col gap-6 overflow-hidden rounded-[20px] border bg-card p-6 md:col-span-2 md:p-8">
      <div class="flex flex-col gap-3">
        <span class="tile-icon"><CalendarCheck :stroke-width="1.8" aria-hidden="true" /></span>
        <h3 class="text-xl font-semibold tracking-[-0.02em]">Agenda com confirmação da paciente</h3>
        <p class="max-w-[440px] text-[15px] leading-relaxed text-secondary-foreground">Marque as sessões da semana. A paciente confirma o horário pela área dela, e você vê quem já confirmou.</p>
      </div>
      <div aria-hidden="true" class="mt-auto flex flex-col gap-2 rounded-2xl bg-surface-subtle p-3 sm:p-4">
        <div
          v-for="(item, index) in week"
          :key="item.day"
          class="preview-item flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5"
          :style="{ transitionDelay: `${0.2 + index * 0.1}s` }"
        >
          <span class="w-9 font-mono text-[11px] uppercase tracking-[.1em] text-muted-foreground">{{ item.day }}</span>
          <span class="font-mono text-[13px] text-muted-foreground">{{ item.time }}</span>
          <span class="flex-1 truncate text-sm font-medium">{{ item.name }}</span>
          <span
            v-if="item.confirmed"
            class="preview-pop inline-flex h-6 items-center gap-1 rounded-full bg-primary px-2 text-[11px] font-medium text-primary-foreground"
            :style="{ transitionDelay: `${0.6 + index * 0.15}s` }"
          ><Check class="size-3" :stroke-width="2.6" />Confirmada</span>
          <span v-else class="inline-flex h-6 items-center rounded-full border-[1.5px] border-primary px-2 text-[11px] font-medium text-positive">Aguardando</span>
        </div>
      </div>
    </article>

    <!-- Check-in -->
    <article data-reveal="1" class="tile flex flex-col gap-6 overflow-hidden rounded-[20px] border bg-card p-6 md:col-span-2 md:p-8">
      <div class="flex flex-col gap-3">
        <span class="tile-icon"><Smile :stroke-width="1.8" aria-hidden="true" /></span>
        <h3 class="text-xl font-semibold tracking-[-0.02em]">Check-in diário de humor</h3>
        <p class="max-w-[440px] text-[15px] leading-relaxed text-secondary-foreground">A paciente marca como está em poucos segundos. Você acompanha os últimos dias na ficha, antes da sessão.</p>
      </div>
      <div aria-hidden="true" class="mt-auto rounded-2xl bg-surface-subtle p-4">
        <div class="flex items-baseline justify-between">
          <p class="label-mono">Últimos 14 dias</p>
          <div class="flex items-center gap-1">
            <span v-for="level in 5" :key="level" class="size-2.5 rounded-sm" :class="moodClass[level - 1]" />
          </div>
        </div>
        <div class="mt-4 flex h-24 items-end gap-1 sm:gap-1.5">
          <span
            v-for="(value, index) in mood"
            :key="index"
            class="preview-bar flex-1 rounded"
            :class="moodClass[value - 1]"
            :style="{ height: `${value * 20}%`, transitionDelay: `${0.2 + index * 0.04}s` }"
          />
        </div>
      </div>
    </article>

    <!-- Menores -->
    <article
      v-for="(item, index) in small.slice(0, 2)"
      :key="item.title"
      :data-reveal="index"
      class="tile flex flex-col gap-3 rounded-[20px] border bg-card p-6"
    >
      <span class="tile-icon"><component :is="item.icon" :stroke-width="1.8" aria-hidden="true" /></span>
      <h3 class="text-[17px] font-semibold tracking-[-0.01em]">{{ item.title }}</h3>
      <p class="text-[15px] leading-relaxed text-secondary-foreground">{{ item.text }}</p>
    </article>

    <!-- Registro Documental -->
    <article data-reveal="2" class="tile flex flex-col gap-6 overflow-hidden rounded-[20px] bg-brand p-6 text-brand-foreground md:col-span-2 md:p-8">
      <div class="flex flex-col gap-3">
        <span class="tile-icon !bg-white/10 !text-highlight"><FileLock2 :stroke-width="1.8" aria-hidden="true" /></span>
        <h3 class="text-xl font-semibold tracking-[-0.02em] text-white">Registro Documental cifrado, só seu</h3>
        <p class="max-w-[440px] text-[15px] leading-relaxed text-[#C3CAF0]">Suas anotações pessoais ficam guardadas com criptografia e só você lê. Nem a clínica tem acesso.</p>
      </div>
      <div aria-hidden="true" class="mt-auto grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl bg-white/[.06] p-4">
          <p class="label-mono !text-brand-muted">Você vê</p>
          <div class="mt-3 flex flex-col gap-2">
            <span class="h-2 w-[94%] rounded-full bg-white/25" />
            <span class="h-2 w-[80%] rounded-full bg-white/25" />
            <span class="h-2 w-[62%] rounded-full bg-white/25" />
          </div>
        </div>
        <div class="rounded-2xl border border-[rgba(220,226,250,.16)] p-4">
          <div class="flex items-center justify-between">
            <p class="label-mono !text-brand-muted">Fica guardado</p>
            <LockKeyhole class="preview-lock size-4 text-highlight" :stroke-width="2" />
          </div>
          <div class="mt-3 flex flex-col gap-1 font-mono text-[11px] leading-snug text-brand-muted">
            <span
              v-for="(line, index) in cipher"
              :key="line"
              class="preview-cipher truncate"
              :style="{ transitionDelay: `${0.4 + index * 0.15}s` }"
            >{{ line }}</span>
          </div>
        </div>
      </div>
    </article>

    <article
      v-for="(item, index) in small.slice(2)"
      :key="item.title"
      :data-reveal="index"
      class="tile flex flex-col gap-3 rounded-[20px] border bg-card p-6 sm:flex-row sm:gap-5 lg:col-span-2"
    >
      <span class="tile-icon shrink-0"><component :is="item.icon" :stroke-width="1.8" aria-hidden="true" /></span>
      <div class="flex flex-col gap-2">
        <h3 class="text-[17px] font-semibold tracking-[-0.01em]">{{ item.title }}</h3>
        <p class="text-[15px] leading-relaxed text-secondary-foreground">{{ item.text }}</p>
      </div>
    </article>
  </div>
</template>

<style scoped>
.tile-icon {
  display: flex;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border-radius: .875rem;
  background: hsl(var(--accent));
  color: hsl(var(--primary));
}
.tile-icon :deep(svg) {
  width: 1.375rem;
  height: 1.375rem;
}
.tile {
  /* Mantém a entrada do .reveal (opacidade e subida) e só soma a borda no hover. */
  transition:
    opacity .7s var(--ease-out) var(--reveal-delay, 0ms),
    transform .7s var(--ease-out) var(--reveal-delay, 0ms),
    border-color .25s ease;
}
.tile:hover {
  border-color: hsl(var(--selected-border));
}

/* Prévias animam junto com a entrada do bloco (classe .reveal-pending sai). */
.preview-item,
.preview-cipher {
  transition: opacity .6s var(--ease-out), transform .6s var(--ease-out);
}
.preview-pop {
  transition: opacity .45s var(--ease-out), transform .45s cubic-bezier(.3, 1.5, .5, 1);
}
.preview-bar {
  transform-origin: bottom;
  transition: transform .7s var(--ease-out);
}
.reveal-pending .preview-item { opacity: 0; transform: translateX(-12px); }
.reveal-pending .preview-pop { opacity: 0; transform: scale(.6); }
.reveal-pending .preview-bar { transform: scaleY(0); }
.reveal-pending .preview-cipher { opacity: 0; transform: translateY(6px); }
</style>
