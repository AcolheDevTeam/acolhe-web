<script setup lang="ts">
import type { Component } from 'vue'
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FileLock2,
  FileText,
  Home,
  LayoutTemplate,
  ListChecks,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  UsersRound,
} from 'lucide-vue-next'
import type { Patient, UserRole, WorkspaceContext } from '~/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const { user, collapsible = false } = defineProps<{
  user?: { email?: string; name?: string; crp?: string; role?: UserRole; workspace?: WorkspaceContext } | null
  /** Desktop: mostra o botão de recolher. No menu do celular fica sempre aberto. */
  collapsible?: boolean
}>()

const collapsedPref = useSidebarCollapsed()
const collapsed = computed(() => collapsible && collapsedPref.value)
function toggleCollapsed() {
  collapsedPref.value = !collapsedPref.value
}

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
// fica em "Clínica" para quem administra; no consultório individual, numa
// seção "Conta" (protótipos "Assinatura" e "Bloqueio").
const adminOnly = computed(() => user?.role === 'org_admin')
const clinicItems: NavItem[] = [
  { label: 'Painel', to: '/clinica', icon: BarChart3 },
  { label: 'Equipe', to: '/clinica/equipe', icon: UsersRound },
  { label: 'Assinatura', to: BILLING_PATH, icon: CreditCard },
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
  else if (user?.workspace?.type === 'individual') list.push({ label: 'Conta', items: [{ label: 'Assinatura', to: BILLING_PATH, icon: CreditCard }] })
  return list
})

const route = useRoute()
const NuxtLinkComponent = resolveComponent('NuxtLink')
function isActive(to: string) {
  // "Painel" é a raiz da área; "Equipe" fica embaixo dela e tem destaque próprio.
  if (to === '/clinica') return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}

const settingsPath = computed(() => user?.role === 'psychologist' ? '/ajustes/perfil' : '/ajustes/seguranca')

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
  <aside
    id="menu-principal"
    :class="[
      'flex h-dvh shrink-0 flex-col gap-6 border-r bg-background py-6 transition-[width] duration-200 ease-[cubic-bezier(.2,.7,.2,1)]',
      collapsed ? 'w-[72px] px-3' : 'w-64 px-4',
    ]"
  >
    <div :class="['flex items-center', collapsed ? 'flex-col gap-3' : 'justify-between gap-2 pl-3']">
      <NuxtLink :to="home" aria-label="Acolhe, ir para o início">
        <AppLogo :with-wordmark="!collapsed" />
      </NuxtLink>
      <!-- Sino só no desktop; no celular ele fica na barra superior (layout). -->
      <NotificationBell v-if="collapsible" size="sm" :class="collapsed ? '' : 'ml-auto'" />
      <Button
        v-if="collapsible"
        variant="ghost"
        size="icon-sm"
        class="shrink-0 text-muted-foreground"
        :aria-label="collapsed ? 'Expandir menu' : 'Recolher menu'"
        :title="collapsed ? 'Expandir menu' : 'Recolher menu'"
        :aria-expanded="!collapsed"
        aria-controls="menu-principal"
        @click="toggleCollapsed"
      >
        <PanelLeftOpen v-if="collapsed" class="size-[18px]" :stroke-width="1.7" />
        <PanelLeftClose v-else class="size-[18px]" :stroke-width="1.7" />
      </Button>
    </div>

    <WorkspaceSwitcher v-if="user?.role !== 'patient' && !collapsed" />

    <nav aria-label="Principal" class="-mx-1 flex flex-1 flex-col gap-0.5 overflow-y-auto px-1">
      <template v-for="(section, i) in sections" :key="section.label ?? i">
        <p v-if="section.label && !collapsed" class="label-mono mx-3 mb-1.5 mt-[18px] text-[11px]">{{ section.label }}</p>
        <div v-else-if="section.label" class="mx-2 my-3 border-t" role="separator" :aria-label="section.label" />
        <component
          :is="item.disabled ? 'span' : NuxtLinkComponent"
          v-for="item in section.items"
          :key="item.to"
          :to="item.disabled ? undefined : item.to"
          :aria-disabled="item.disabled || undefined"
          :aria-current="!item.disabled && isActive(item.to) ? 'page' : undefined"
          :title="item.disabled ? `${item.label} · em breve` : collapsed ? item.label : undefined"
          :class="[
            'flex h-10 shrink-0 items-center gap-3 rounded-lg text-sm font-medium transition-colors',
            collapsed ? 'justify-center px-0' : 'px-3',
            item.disabled
              ? 'cursor-not-allowed text-muted-foreground/50'
              : isActive(item.to)
              ? 'bg-accent text-accent-foreground'
              : 'text-secondary-foreground hover:bg-surface-hover hover:text-foreground',
          ]"
        >
          <component :is="item.icon" class="size-[18px] shrink-0" :stroke-width="1.7" />
          <span :class="collapsed ? 'sr-only' : 'flex-1 truncate'">{{ item.label }}</span>
          <span v-if="item.count !== undefined && !collapsed" class="font-mono text-xs tabular-nums text-muted-foreground">
            {{ item.count }}
          </span>
        </component>
      </template>
    </nav>

    <div
      :class="[
        '-mb-6 mt-auto flex items-center border-t py-3',
        collapsed ? '-mx-3 flex-col gap-2 px-3' : '-mx-4 gap-2.5 px-4',
      ]"
    >
      <Avatar class="size-[34px] text-[13px]" :title="collapsed ? displayName : undefined">
        <AvatarFallback>{{ initials }}</AvatarFallback>
      </Avatar>
      <div v-if="!collapsed" class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold">{{ displayName }}</p>
        <p v-if="user?.crp" class="truncate font-mono text-[11px] text-muted-foreground">CRP {{ user.crp }}</p>
      </div>
      <!-- Ajustes (ACO-98): a engrenagem abre Perfil; quem só administra a
           clínica não tem perfil de psicóloga e cai em Segurança. -->
      <NuxtLink
        :to="settingsPath"
        aria-label="Ajustes"
        title="Ajustes"
        :aria-current="route.path.startsWith('/ajustes') ? 'page' : undefined"
        :class="[
          'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
          route.path.startsWith('/ajustes')
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
        ]"
      >
        <Settings class="size-[18px]" :stroke-width="1.7" />
      </NuxtLink>
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
