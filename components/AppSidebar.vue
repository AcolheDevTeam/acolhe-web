<script setup lang="ts">
import type { Component } from 'vue'
import {
  BookMarked,
  CalendarDays,
  ClipboardList,
  FileLock2,
  FileText,
  Home,
  Settings,
  Users,
} from 'lucide-vue-next'
import type { Patient, UserRole } from '~/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const { user } = defineProps<{
  user?: { email?: string; name?: string; crp?: string; role?: UserRole } | null
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

const main = computed<NavItem[]>(() => [
  { label: 'Início', to: '/dashboard', icon: Home },
  {
    label: 'Pacientes',
    to: '/patients',
    icon: Users,
    count: user?.role === 'psychologist' ? patients.value.length : undefined,
  },
  { label: 'Agenda', to: '/agenda', icon: CalendarDays, disabled: true },
  { label: 'Atividades', to: '/activities', icon: ClipboardList },
  { label: 'Documentos', to: '/documents', icon: FileText, disabled: true },
])

const personal: NavItem[] = [
  { label: 'Registro Documental', to: '/registry', icon: FileLock2, disabled: true },
  { label: 'Templates', to: '/templates', icon: BookMarked },
]

const route = useRoute()
const NuxtLinkComponent = resolveComponent('NuxtLink')
function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

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
  <aside class="flex h-dvh w-60 shrink-0 flex-col border-r bg-card/40">
    <div class="flex h-16 items-center px-6">
      <NuxtLink to="/dashboard">
        <AppLogo />
      </NuxtLink>
    </div>

    <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
      <component
        :is="item.disabled ? 'span' : NuxtLinkComponent"
        v-for="item in main"
        :key="item.to"
        :to="item.disabled ? undefined : item.to"
        :aria-disabled="item.disabled || undefined"
        :title="item.disabled ? 'Em breve' : undefined"
        :class="[
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          item.disabled
            ? 'cursor-not-allowed text-muted-foreground/45'
            : isActive(item.to)
            ? 'bg-accent font-medium text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        ]"
      >
        <component :is="item.icon" class="size-4 shrink-0" :stroke-width="1.75" />
        <span class="flex-1">{{ item.label }}</span>
        <span v-if="item.count !== undefined" class="text-xs tabular-nums text-muted-foreground">
          {{ item.count }}
        </span>
      </component>

      <p class="label-mono px-3 pb-2 pt-6">Espaço pessoal</p>

      <component
        :is="item.disabled ? 'span' : NuxtLinkComponent"
        v-for="item in personal"
        :key="item.to"
        :to="item.disabled ? undefined : item.to"
        :aria-disabled="item.disabled || undefined"
        :title="item.disabled ? 'Em breve' : undefined"
        :class="[
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          item.disabled
            ? 'cursor-not-allowed text-muted-foreground/45'
            : isActive(item.to)
            ? 'bg-accent font-medium text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        ]"
      >
        <component :is="item.icon" class="size-4 shrink-0" :stroke-width="1.75" />
        <span class="flex-1">{{ item.label }}</span>
      </component>
    </nav>

    <div class="mt-auto flex flex-col gap-1 border-t p-3">
      <span
        aria-disabled="true"
        title="Em breve"
        class="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/45"
      >
        <Settings class="size-4" :stroke-width="1.75" />
        <span>Ajustes</span>
      </span>
      <div class="flex items-center gap-3 rounded-md px-3 py-2">
        <Avatar class="size-8">
          <AvatarFallback class="bg-secondary text-xs">{{ initials }}</AvatarFallback>
        </Avatar>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">{{ displayName }}</p>
          <p v-if="user?.crp" class="truncate text-xs text-muted-foreground">
            CRP {{ user.crp }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>
