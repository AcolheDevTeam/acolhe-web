<script setup lang="ts">
import type { Component } from 'vue'
import {
  BarChart3,
  CalendarDays,
  FileLock2,
  FileText,
  Home,
  LayoutTemplate,
  ListChecks,
  LogOut,
  Settings,
  Users,
  UsersRound,
} from 'lucide-vue-next'
import type { Patient, UserRole, WorkspaceContext } from '~/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const { user } = defineProps<{
  user?: { email?: string; name?: string; crp?: string; role?: UserRole; workspace?: WorkspaceContext } | null
}>()

const { data: patients } = await useFetch<Patient[]>('/api/patients', {
  key: 'patients-list',
  default: () => [],
  immediate: user?.role === 'psychologist',
})

type NavItem = {
  label: string
  to: string
  icon: Component
  count?: number
  disabled?: boolean
}
type NavSection = { label?: string, items: NavItem[] }

// Seções do protótipo: Principal, "Só você" e "Clínica" (só admin). Quem só
// administra a clínica não tem área clínica (ADR 0002 da API). "Assinatura"
// fica de fora até a cobrança ser decidida.
const adminOnly = computed(() => user?.role === 'org_admin')
const clinicItems: NavItem[] = [
  { label: 'Painel', to: '/clinica', icon: BarChart3 },
  { label: 'Equipe', to: '/clinica/equipe', icon: UsersRound },
]
const home = computed(() => homeFor(user as never))

const sections = computed<NavSection[]>(() => {
  if (adminOnly.value) return [{ items: isClinicAdmin(user as never) ? clinicItems : [] }]
  const list: NavSection[] = [
    {
      items: [
        { label: 'Início', to: '/dashboard', icon: Home },
        {
          label: 'Pacientes',
          to: '/patients',
          icon: Users,
          count: user?.role === 'psychologist' ? patients.value.length : undefined,
        },
        { label: 'Agenda', to: '/agenda', icon: CalendarDays },
        { label: 'Atividades', to: '/activities', icon: ListChecks },
        { label: 'Documentos', to: '/documents', icon: FileText, disabled: true },
        { label: 'Templates', to: '/templates', icon: LayoutTemplate },
      ],
    },
    { label: 'Só você', items: [{ label: 'Registro Documental', to: '/registry', icon: FileLock2 }] },
  ]
  if (isClinicAdmin(user as never)) list.push({ label: 'Clínica', items: clinicItems })
  return list
})

const route = useRoute()
const NuxtLinkComponent = resolveComponent('NuxtLink')
function isActive(to: string) {
  // "Painel" é a raiz da área; "Equipe" fica embaixo dela e tem destaque próprio.
  if (to === '/clinica') return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}

const { logout, isLoggingOut } = useLogout()

const displayName = computed(() => user?.name ?? user?.email ?? 'Minha conta')
const initials = computed(() =>
  displayName.value
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <aside class="flex h-dvh w-64 shrink-0 flex-col gap-6 border-r bg-background px-4 py-6">
    <NuxtLink :to="home" class="px-3" aria-label="Acolhe, ir para o início">
      <AppLogo />
    </NuxtLink>

    <WorkspaceSwitcher v-if="user?.role !== 'patient'" />

    <nav aria-label="Principal" class="-mx-1 flex flex-1 flex-col gap-0.5 overflow-y-auto px-1">
      <template v-for="(section, i) in sections" :key="section.label ?? i">
        <p v-if="section.label" class="label-mono mx-3 mb-1.5 mt-[18px] text-[11px]">{{ section.label }}</p>
        <component
          :is="item.disabled ? 'span' : NuxtLinkComponent"
          v-for="item in section.items"
          :key="item.to"
          :to="item.disabled ? undefined : item.to"
          :aria-disabled="item.disabled || undefined"
          :aria-current="!item.disabled && isActive(item.to) ? 'page' : undefined"
          :title="item.disabled ? 'Em breve' : undefined"
          :class="[
            'flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
            item.disabled
              ? 'cursor-not-allowed text-muted-foreground/50'
              : isActive(item.to)
              ? 'bg-accent text-accent-foreground'
              : 'text-secondary-foreground hover:bg-surface-hover hover:text-foreground',
          ]"
        >
          <component :is="item.icon" class="size-[18px] shrink-0" :stroke-width="1.7" />
          <span class="flex-1 truncate">{{ item.label }}</span>
          <span v-if="item.count !== undefined" class="font-mono text-xs tabular-nums text-muted-foreground">
            {{ item.count }}
          </span>
        </component>
      </template>
    </nav>

    <div class="-mx-4 -mb-6 mt-auto flex items-center gap-2.5 border-t px-4 py-3">
      <Avatar class="size-[34px] text-[13px]">
        <AvatarFallback>{{ initials }}</AvatarFallback>
      </Avatar>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold">{{ displayName }}</p>
        <p v-if="user?.crp" class="truncate font-mono text-[11px] text-muted-foreground">CRP {{ user.crp }}</p>
      </div>
      <!-- Ajustes ainda não existe; fica visível e desabilitado, como antes. -->
      <span
        aria-disabled="true"
        title="Ajustes · em breve"
        class="flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-lg text-muted-foreground/50"
      >
        <Settings class="size-[18px]" :stroke-width="1.7" />
        <span class="sr-only">Ajustes (em breve)</span>
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        class="shrink-0 text-muted-foreground"
        :loading="isLoggingOut"
        :aria-label="isLoggingOut ? 'Saindo…' : 'Sair'"
        title="Sair"
        @click="logout"
      >
        <LogOut v-if="!isLoggingOut" class="size-[18px]" :stroke-width="1.7" />
      </Button>
    </div>
  </aside>
</template>
