<script setup lang="ts">
import { ArrowRight, EyeOff, FileLock2, ShieldCheck, Users } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { User } from '~/types'
import { TRIAL_DAYS } from '~/utils/plans'

// Landing pública do Acolhe. Sem middleware de auth: quem tem sessão vê "Ir
// para o app" no topo; as rotas privadas continuam mandando ao /login.
definePageMeta({ layout: 'auth' })

const title = 'Acolhe · Agenda, prontuário e acompanhamento para psicólogas'
const description = 'Agenda com confirmação da paciente, prontuário por sessão, atividades e check-in de humor entre as sessões. Feito para psicólogas no Brasil, com LGPD. Teste grátis por 7 dias, sem cartão.'
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogLocale: 'pt_BR',
  ogSiteName: 'Acolhe',
  twitterCard: 'summary',
  twitterTitle: title,
  twitterDescription: description,
})

// /api/me devolve null sem sessão (não chama a API), então não quebra para visitantes.
const { data: me } = await useFetch<User | null>('/api/me', { key: 'me' })
const appHref = computed(() => me.value ? homeFor(me.value) : undefined)

const links = [
  { href: '#recursos', label: 'Recursos' },
  { href: '#seguranca', label: 'Segurança' },
  { href: '#planos', label: 'Planos' },
  { href: '#perguntas', label: 'Perguntas' },
]

const steps = [
  { title: 'Você envia uma atividade', text: 'Escolha um template ou escreva uma tarefa nova, com prazo.' },
  { title: 'A paciente responde no celular', text: 'Ela vê o que tem para fazer e faz o check-in do dia na mesma área.' },
  { title: 'Você revisa antes da sessão', text: 'Respostas e humor dos últimos dias ficam na ficha, prontos para a conversa.' },
]

const security = [
  { icon: ShieldCheck, title: 'Consentimento antes dos dados', text: 'Os dados clínicos só ficam disponíveis depois que a paciente aceita o convite e o termo de consentimento (LGPD, art. 11).' },
  { icon: FileLock2, title: 'Registro Documental cifrado', text: 'O que você escreve ali é guardado com criptografia e só aparece para você.' },
  { icon: Users, title: 'Cada psicóloga vê só os seus pacientes', text: 'Na clínica, a administração vê números agregados. Nunca prontuários ou nomes de pacientes.' },
  { icon: EyeOff, title: 'Nenhuma IA lendo prontuário', text: 'O conteúdo clínico não é enviado a ferramentas de inteligência artificial.' },
]

const clinicPanel = [
  { name: 'Ana', sessions: 42 },
  { name: 'Beatriz', sessions: 35 },
  { name: 'Carlos', sessions: 28 },
  { name: 'Daniela', sessions: 19 },
]

const faq = [
  {
    q: 'Preciso de cartão para testar?',
    a: `Não. O teste dura ${TRIAL_DAYS} dias. Você só informa um cartão se decidir assinar.`,
  },
  {
    q: 'O que acontece quando o teste acaba?',
    a: 'Se você não assinar, a conta fica só para leitura: dá para ver o que já está lá, mas não criar nem editar. Ao assinar, tudo volta a funcionar como antes.',
  },
  {
    q: 'Como cancelo?',
    a: 'Pela tela de assinatura, a qualquer momento, sem precisar falar com ninguém.',
  },
  {
    q: 'Onde ficam os dados das minhas pacientes?',
    a: 'Nos servidores do Acolhe, com acesso restrito à psicóloga responsável. Os dados clínicos só são tratados depois do consentimento da paciente, e o Registro Documental é cifrado.',
  },
  {
    q: 'Como funciona a cobrança da clínica?',
    a: 'Por psicóloga ativa, com mínimo de 2. Quem só administra a clínica, sem atender, não paga.',
  },
]

const root = ref<HTMLElement | null>(null)
useReveal(root)

const year = new Date().getFullYear()
</script>

<template>
  <div ref="root" class="overflow-x-clip">
    <a href="#conteudo" class="sr-only z-50 rounded-lg bg-card px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Pular para o conteúdo</a>
    <LandingHeader :links="links" :app-href="appHref" />

    <main id="conteudo">
      <!-- Hero -->
      <section class="hero relative isolate overflow-hidden" aria-labelledby="hero-title">
        <div class="hero-wash pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <svg
          class="hero-arcs pointer-events-none absolute -z-10"
          viewBox="0 0 24 24"
          fill="none"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path pathLength="1" d="M22 17a10 10 0 0 0-20 0" stroke="hsl(var(--primary))" />
          <path pathLength="1" d="M18 17a6 6 0 0 0-12 0" stroke="#FF7A5C" />
          <path pathLength="1" d="M14 17a2 2 0 0 0-4 0" stroke="hsl(var(--brand))" />
        </svg>
        <div class="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-16 pt-8 md:px-8 md:pt-12 lg:min-h-[min(700px,calc(100svh-72px))] lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-16 lg:pt-6">
          <div class="flex flex-col gap-6">
            <p class="animate-rise inline-flex w-fit items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[.14em] text-muted-foreground backdrop-blur">
              <span class="size-1.5 rounded-full bg-highlight" aria-hidden="true" />
              Para psicólogas no Brasil
            </p>
            <h1 id="hero-title" class="animate-rise text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] [animation-delay:.08s] sm:text-[52px] lg:text-[58px]">
              Agenda, prontuário e o cuidado <span class="text-primary">entre as sessões.</span>
            </h1>
            <p class="animate-rise max-w-[520px] text-[17px] leading-relaxed text-secondary-foreground [animation-delay:.16s] md:text-lg">
              No Acolhe você marca as sessões, registra a evolução e envia atividades. A paciente confirma horários, responde e faz o check-in do dia pelo celular.
            </p>
            <div class="animate-rise flex flex-col gap-3 pt-1 [animation-delay:.24s] sm:flex-row">
              <Button as-child size="xl">
                <NuxtLink to="/signup">Começar teste grátis <ArrowRight /></NuxtLink>
              </Button>
              <Button as-child size="xl" variant="outline">
                <a href="#planos">Ver planos</a>
              </Button>
            </div>
            <div class="animate-rise flex flex-wrap items-center gap-x-4 gap-y-1.5 [animation-delay:.32s]">
              <p class="text-sm text-muted-foreground">{{ TRIAL_DAYS }} dias grátis, sem cartão.</p>
              <span class="hidden h-3 w-px bg-input sm:block" aria-hidden="true" />
              <p class="font-mono text-xs tracking-[.06em] text-muted-foreground">LGPD · CFP 01/2009 · Lei 13.787/2018</p>
            </div>
          </div>
          <LandingHeroMock />
        </div>
      </section>

      <!-- Recursos -->
      <LandingCurve class="-mb-px text-card" />
      <section id="recursos" class="scroll-mt-16 bg-card pb-20 pt-12 md:pb-24 md:pt-16" aria-labelledby="recursos-title">
        <div class="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 md:px-8">
          <LandingSectionHeading
            id="recursos-title"
            eyebrow="Recursos"
            title="O que você usa no dia a dia do consultório"
            support="Ferramentas simples, pensadas para a rotina de quem atende. Tudo o que está aqui já funciona hoje."
          />
          <LandingFeatures />
        </div>
      </section>
      <div class="h-24 bg-gradient-to-b from-card to-background md:h-32" aria-hidden="true" />

      <!-- Entre as sessões -->
      <section class="pb-20 pt-4 md:pb-28" aria-labelledby="entre-title">
        <div class="mx-auto grid max-w-[1200px] items-center gap-12 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
          <div class="flex flex-col gap-10">
            <LandingSectionHeading
              id="entre-title"
              eyebrow="Entre as sessões"
              title="O acompanhamento não para quando a sessão termina"
              support="As atividades e o check-in ajudam a paciente a manter o que foi combinado. E chegam organizados para você."
            />
            <ol class="flex flex-col">
              <li v-for="(step, index) in steps" :key="step.title" :data-reveal="index + 1" class="flex gap-5 border-t py-5 last:border-b">
                <span class="w-8 shrink-0 font-mono text-sm text-primary">0{{ index + 1 }}</span>
                <div class="flex flex-col gap-1">
                  <h3 class="text-base font-semibold">{{ step.title }}</h3>
                  <p class="text-[15px] leading-relaxed text-secondary-foreground">{{ step.text }}</p>
                </div>
              </li>
            </ol>
          </div>
          <div data-reveal="2" class="overflow-hidden rounded-[20px] bg-secondary p-6 md:p-10">
            <img
              src="/images/login-ilustracao.jpg"
              alt="Ilustração de uma sessão de psicologia: paciente e psicóloga conversando em frente a uma ficha clínica"
              width="1400"
              height="1400"
              loading="lazy"
              decoding="async"
              class="mx-auto h-auto w-full max-w-[480px] mix-blend-multiply"
            >
          </div>
        </div>
      </section>

      <!-- Segurança -->
      <LandingCurve class="-mb-px text-brand" />
      <section id="seguranca" class="dark-surface scroll-mt-16 bg-brand pb-16 pt-12 text-brand-foreground md:pb-24 md:pt-16" aria-labelledby="seguranca-title">
        <div class="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 md:px-8">
          <LandingSectionHeading
            id="seguranca-title"
            tone="brand"
            eyebrow="Segurança e privacidade"
            title="Dados de saúde tratados como dados de saúde"
            support="O Acolhe foi construído a partir da LGPD, da Resolução CFP 01/2009 e da Lei 13.787/2018, que trata do prontuário eletrônico."
          />
          <ul class="grid gap-5 sm:grid-cols-2">
            <li
              v-for="(item, index) in security"
              :key="item.title"
              :data-reveal="index % 2"
              class="flex gap-4 rounded-2xl border border-[rgba(220,226,250,.16)] bg-white/[.04] p-6"
            >
              <component :is="item.icon" class="mt-0.5 size-5 shrink-0 text-highlight" :stroke-width="1.8" aria-hidden="true" />
              <div class="flex flex-col gap-1.5">
                <h3 class="text-base font-semibold text-white">{{ item.title }}</h3>
                <p class="text-[15px] leading-relaxed text-[#C3CAF0]">{{ item.text }}</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <LandingCurve flip class="-mt-px text-brand" />

      <!-- Para clínicas -->
      <section id="clinicas" class="scroll-mt-16 py-20 md:py-28" aria-labelledby="clinicas-title">
        <div class="mx-auto grid max-w-[1200px] items-center gap-12 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
          <div class="flex flex-col gap-8 lg:order-2">
            <LandingSectionHeading
              id="clinicas-title"
              eyebrow="Para clínicas"
              title="Uma conta para a equipe, cada psicóloga com a sua agenda"
              support="A clínica convida as profissionais e acompanha o movimento no painel. O conteúdo clínico continua com quem atende."
            />
            <ul data-reveal="1" class="flex flex-col gap-3 text-[15px] text-secondary-foreground">
              <li class="flex gap-3"><span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />Convites para a equipe entrar e gestão de quem está ativa.</li>
              <li class="flex gap-3"><span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />Painel com sessões, pacientes ativos e próximos horários por profissional.</li>
              <li class="flex gap-3"><span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />Cobrança por psicóloga ativa. Quem só administra não paga.</li>
            </ul>
          </div>
          <div data-reveal="2" aria-hidden="true" class="rounded-[20px] border bg-card p-6 md:p-8 lg:order-1">
            <div class="flex items-baseline justify-between gap-3">
              <p class="text-lg font-semibold tracking-[-0.02em]">Painel da clínica</p>
              <p class="label-mono">Últimos 30 dias</p>
            </div>
            <div class="mt-6 grid grid-cols-3 gap-3">
              <div class="rounded-xl bg-surface-subtle p-3">
                <p class="label-mono text-[10px]">Sessões</p>
                <p class="mt-1 font-mono text-xl font-medium"><LandingCountUp :value="124" /></p>
              </div>
              <div class="rounded-xl bg-surface-subtle p-3">
                <p class="label-mono text-[10px]">Pacientes</p>
                <p class="mt-1 font-mono text-xl font-medium"><LandingCountUp :value="38" /></p>
              </div>
              <div class="rounded-xl bg-surface-subtle p-3">
                <p class="label-mono text-[10px]">Próximas</p>
                <p class="mt-1 font-mono text-xl font-medium"><LandingCountUp :value="21" /></p>
              </div>
            </div>
            <ul class="mt-6 flex flex-col gap-3.5">
              <li v-for="row in clinicPanel" :key="row.name" class="flex items-center gap-3">
                <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{{ row.name[0] }}</span>
                <span class="w-16 text-sm font-medium">{{ row.name }}</span>
                <span class="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span class="clinic-bar block h-full rounded-full bg-primary" :style="{ width: `${row.sessions / 42 * 100}%` }" />
                </span>
                <span class="w-7 text-right font-mono text-[13px] text-muted-foreground"><LandingCountUp :value="row.sessions" /></span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Planos -->
      <LandingCurve class="-mb-px text-card" />
      <section id="planos" class="scroll-mt-16 bg-card pb-12 pt-12 md:pb-16 md:pt-16" aria-labelledby="planos-title">
        <div class="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 md:px-8">
          <LandingSectionHeading
            id="planos-title"
            align="center"
            eyebrow="Planos"
            title="Planos para psicólogas autônomas e clínicas"
            support="Todos os planos têm os mesmos recursos clínicos. Muda o tamanho da equipe."
          />
          <LandingPlans />
        </div>
      </section>

      <div class="h-24 bg-gradient-to-b from-card to-background md:h-32" aria-hidden="true" />

      <!-- Perguntas -->
      <section id="perguntas" class="scroll-mt-16 pb-20 pt-4 md:pb-28" aria-labelledby="perguntas-title">
        <div class="mx-auto grid max-w-[1200px] gap-10 px-4 md:px-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <LandingSectionHeading
            id="perguntas-title"
            eyebrow="Perguntas frequentes"
            title="Antes de começar"
            support="Ficou alguma dúvida? Crie a conta e teste com calma. O teste não pede cartão."
          />
          <Accordion data-reveal="1" type="single" collapsible class="border-t">
            <AccordionItem v-for="(item, index) in faq" :key="item.q" :value="`faq-${index}`">
              <AccordionTrigger>{{ item.q }}</AccordionTrigger>
              <AccordionContent>{{ item.a }}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <!-- CTA final -->
      <section class="px-4 pb-20 md:px-8 md:pb-28" aria-labelledby="cta-title">
        <div data-reveal class="dark-surface relative mx-auto flex max-w-[1200px] flex-col items-start gap-6 overflow-hidden rounded-[20px] bg-brand px-6 py-12 text-brand-foreground md:items-center md:px-12 md:py-16 md:text-center">
          <svg class="cta-arcs pointer-events-none absolute -bottom-24 -right-16 size-[340px] opacity-25 md:-bottom-32 md:right-6 md:size-[420px]" viewBox="0 0 24 24" fill="none" stroke-width="1" stroke-linecap="round" aria-hidden="true">
            <path d="M22 17a10 10 0 0 0-20 0" stroke="#9DB0F5" />
            <path d="M18 17a6 6 0 0 0-12 0" stroke="#FF7A5C" />
            <path d="M14 17a2 2 0 0 0-4 0" stroke="#E8EBFB" />
          </svg>
          <h2 id="cta-title" class="relative max-w-[640px] text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-white md:text-[44px]">
            Comece hoje, com {{ TRIAL_DAYS }} dias grátis.
          </h2>
          <p class="relative max-w-[480px] text-base leading-relaxed text-[#C3CAF0] md:text-[17px]">Crie a conta, cadastre a primeira paciente e veja se o Acolhe cabe na sua rotina. Sem cartão.</p>
          <div class="relative flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button as-child size="xl" variant="on-brand">
              <NuxtLink to="/signup">Começar teste grátis</NuxtLink>
            </Button>
            <Button as-child size="xl" variant="on-brand-outline">
              <NuxtLink :to="appHref ?? '/login'">{{ appHref ? 'Ir para o app' : 'Já tenho conta' }}</NuxtLink>
            </Button>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t bg-card">
      <div class="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-12 md:flex-row md:justify-between md:px-8">
        <div class="flex max-w-[320px] flex-col gap-3">
          <AppLogo :size="24" />
          <p class="text-sm leading-relaxed text-muted-foreground">Agenda, prontuário e acompanhamento entre sessões para psicólogas no Brasil.</p>
        </div>
        <div class="grid grid-cols-2 gap-10 sm:gap-16">
          <nav aria-label="Seções" class="flex flex-col gap-2.5 text-sm">
            <p class="label-mono mb-1">Produto</p>
            <a v-for="link in links" :key="link.href" :href="link.href" class="text-secondary-foreground hover:text-foreground">{{ link.label }}</a>
          </nav>
          <nav aria-label="Conta" class="flex flex-col gap-2.5 text-sm">
            <p class="label-mono mb-1">Conta</p>
            <NuxtLink to="/login" class="text-secondary-foreground hover:text-foreground">Entrar</NuxtLink>
            <NuxtLink to="/signup" class="text-secondary-foreground hover:text-foreground">Criar conta</NuxtLink>
          </nav>
        </div>
      </div>
      <div class="border-t">
        <div class="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between md:px-8">
          <p>© {{ year }} Acolhe</p>
          <p class="font-mono tracking-[.06em]">LGPD · CFP 01/2009 · Lei 13.787/2018</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Fundo do hero: névoa com um véu índigo e um toque de salmão, e os três arcos
   do logo em traço fino, bem apagados, desenhados na carga (arcdraw). */
.hero-wash {
  background:
    radial-gradient(55% 60% at 80% 35%, hsl(var(--accent)) 0%, transparent 70%),
    radial-gradient(30% 30% at 95% 0%, rgba(255, 138, 112, .12) 0%, transparent 70%),
    radial-gradient(40% 50% at 0% 100%, hsl(var(--accent) / .6) 0%, transparent 70%);
}
.hero-arcs {
  width: min(1100px, 150vw);
  right: -18%;
  top: 4%;
  opacity: .14;
  stroke-width: .12;
  /* Some antes da borda do hero, sem corte seco na curva da seção seguinte. */
  -webkit-mask-image: linear-gradient(to bottom, #000 45%, transparent 72%);
  mask-image: linear-gradient(to bottom, #000 45%, transparent 72%);
}
.hero-arcs path {
  stroke-dasharray: 1;
  animation: arcdraw 1.8s cubic-bezier(.65, 0, .35, 1) backwards;
}
.hero-arcs path:nth-child(1) { animation-delay: .1s; }
.hero-arcs path:nth-child(2) { animation-delay: .35s; }
.hero-arcs path:nth-child(3) { animation-delay: .6s; }
@media (max-width: 1023px) {
  .hero-arcs { right: -40%; top: auto; bottom: -8%; opacity: .08; }
}
.feature {
  transition: background-color .25s ease;
}
.feature:hover {
  background-color: hsl(var(--surface-subtle));
}
.dark-surface :focus-visible {
  outline-color: hsl(var(--highlight));
}
.clinic-bar {
  transform-origin: left;
}
[data-reveal]:not(.reveal-pending) .clinic-bar {
  animation: bar-in 1s var(--ease-out) .2s both;
}
@keyframes bar-in {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
</style>
