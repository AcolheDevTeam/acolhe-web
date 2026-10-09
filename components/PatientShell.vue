<script setup lang="ts">
import { CalendarDays, Clock3, MoreHorizontal, Plus } from 'lucide-vue-next'
import type { Patient } from '~/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const { patient, patientId, active } = defineProps<{
  patient: Patient | null
  patientId: string
  active: 'overview' | 'sessions' | 'activities' | 'checkins' | 'registry'
}>()

const config = useRuntimeConfig()
const lgpdExportEnabled = computed(() =>
  String(config.public.lgpdExportEnabled).toLowerCase() === 'true',
)

const tabs = computed(() => [
  { key: 'overview', label: 'Visão geral', to: `/patients/${patientId}` },
  { key: 'sessions', label: 'Prontuário', to: `/patients/${patientId}/sessions` },
  { key: 'activities', label: 'Atividades', to: `/patients/${patientId}/activities` },
  { key: 'checkins', label: 'Check-ins', to: `/patients/${patientId}/checkins` },
  { key: 'registry', label: 'Registro Documental', to: `/patients/${patientId}/registry` },
].filter(tab => isActive.value || tab.key === 'overview' || tab.key === 'registry'))

const isActive = computed(() => patientLinkActive(patient))

// Linha sob o nome: idade e abordagem só quando a API mandar.
const meta = computed(() => {
  const p = patient
  if (!p) return []
  return [p.age ? `${p.age} anos` : null, p.approach].filter(Boolean) as string[]
})
const badge = computed(() => patient ? relationshipBadge(patient) : null)

// No celular a aba ativa pode ficar fora da fileira (ex.: Check-ins): rola só a
// fileira até ela, sem mexer na página.
const tabsNav = ref<HTMLElement>()
onMounted(() => {
  const nav = tabsNav.value
  const current = nav?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!nav || !current) return
  const overflow = current.offsetLeft + current.offsetWidth - (nav.scrollLeft + nav.clientWidth)
  if (overflow > 0) nav.scrollLeft += overflow + 16
})
</script>

<template>
  <PageHeader>
    <template #title>
      <nav aria-label="Caminho" class="flex min-w-0 items-center gap-2 font-mono text-xs tracking-[.06em] text-muted-foreground">
        <NuxtLink to="/patients" class="underline-offset-[3px] hover:text-foreground hover:underline">Pacientes</NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="truncate text-foreground">{{ patient?.fullName ?? '—' }}</span>
      </nav>
    </template>
  </PageHeader>

  <div class="flex flex-col gap-7 px-4 pb-14 pt-5 md:px-8 lg:px-12">
    <!-- Perfil -->
    <header class="animate-rise flex flex-wrap items-center gap-5 [animation-delay:60ms]">
      <Avatar
        :tone="patient?.relationshipStatus === 'pending' ? 'pending' : 'brand'"
        class="size-16 text-[22px]"
        :class="{ 'text-highlight': patient?.relationshipStatus !== 'pending' }"
        aria-hidden="true"
      >
        <AvatarFallback>{{ initials(patient?.fullName) }}</AvatarFallback>
      </Avatar>
      <div class="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
        <h1 class="break-words text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[32px]">
          {{ patient?.fullName ?? '—' }}
        </h1>
        <div class="flex flex-wrap items-center gap-2.5 text-sm text-secondary-foreground">
          <template v-for="item in meta" :key="item">
            <span>{{ item }}</span>
            <span aria-hidden="true" class="text-input-hover">·</span>
          </template>
          <Badge v-if="badge" :variant="badge.variant" class="h-6">{{ badge.label }}</Badge>
        </div>
      </div>
      <!-- No celular as três ações dividem uma linha (sem ícone nos botões). -->
      <div v-if="isActive" class="flex w-full items-center gap-2 sm:w-auto sm:gap-2.5">
        <AssignActivityDialog :patient-id="patientId">
          <Button variant="outline" class="min-w-0 flex-1 px-3 sm:flex-none sm:px-4">
            <Plus class="max-sm:hidden" />
            Atribuir atividade
          </Button>
        </AssignActivityDialog>
        <NewSessionDialog :patient-id="patientId">
          <Button class="min-w-0 flex-1 px-3 sm:flex-none sm:px-4">
            <CalendarDays class="max-sm:hidden" />
            Agendar sessão
          </Button>
        </NewSessionDialog>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" aria-label="Mais ações">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem v-if="lgpdExportEnabled">Exportar dados (LGPD)</DropdownMenuItem>
              <DropdownMenuItem>Arquivar paciente</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <!-- Abas sublinhadas: a barra de 2px cresce a partir do centro. No celular
         a fileira rola sozinha, sem rolar a página. -->
    <nav
      ref="tabsNav"
      aria-label="Seções da ficha"
      class="animate-rise relative -mx-4 flex overflow-x-auto border-b px-4 [animation-delay:120ms] [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <NuxtLink
        v-for="t in tabs"
        :key="t.key"
        :to="t.to"
        :aria-current="active === t.key ? 'page' : undefined"
        :class="[
          'relative mr-6 flex h-12 shrink-0 items-center whitespace-nowrap px-1 text-[15px] font-medium transition-colors duration-200 last:mr-0',
          'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-[420ms] after:ease-[cubic-bezier(.2,.7,.2,1)]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
          active === t.key
            ? 'text-foreground after:scale-x-100'
            : 'text-muted-foreground after:scale-x-0 hover:text-foreground',
        ]"
      >
        {{ t.label }}
      </NuxtLink>
    </nav>

    <!-- Fora da visão geral (que tem o próprio estado), avisa por que o resto da ficha está fechado. -->
    <InlineNotice v-if="patient && !isActive && active !== 'overview'" tone="neutral" class="flex items-start gap-3">
      <Clock3 class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        <span class="font-medium text-foreground">Vínculo ainda não ativado.</span>
        Sessões e atividades serão liberadas somente depois que a paciente aceitar o consentimento.
      </p>
    </InlineNotice>

    <!-- Conteúdo: coluna principal e lateral quebram em uma coluna no celular. -->
    <div class="flex flex-wrap items-start gap-6">
      <div class="min-w-0 flex-[2_1_460px]">
        <slot />
      </div>
      <aside v-if="$slots.aside" class="flex min-w-0 flex-[1_1_280px] flex-col gap-6">
        <slot name="aside" />
      </aside>
    </div>
  </div>
</template>
