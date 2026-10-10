<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'
import type { User } from '~/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Cabeçalho das telas da paciente (protótipo): eyebrow mono + H1 e o avatar à
// direita (só no Início, como no protótipo: `account`). No protótipo o avatar
// leva a Ajustes; enquanto Ajustes não existe, ele abre um menu com "Sair".
defineProps<{ title: string, eyebrow?: string, description?: string, account?: boolean }>()

const { data: me } = useFetch<User | null>('/api/me', { key: 'me' })
const { logout, isLoggingOut } = useLogout()
const name = computed(() => me.value?.patient?.fullName ?? '')
const initials = computed(() => name.value.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase())
</script>

<template>
  <header class="animate-rise flex items-center justify-between gap-4">
    <div class="flex min-w-0 flex-col gap-1.5">
      <p v-if="eyebrow" class="label-mono">{{ eyebrow }}</p>
      <h1 :class="['font-semibold leading-[1.1] tracking-[-0.03em]', account ? 'text-[30px]' : 'text-[28px]']">{{ title }}</h1>
      <p v-if="description || $slots.description" class="flex items-center gap-1.5 text-[13px] leading-relaxed text-muted-foreground"><slot name="description">{{ description }}</slot></p>
    </div>
    <DropdownMenu v-if="account">
      <DropdownMenuTrigger
        class="flex size-11 shrink-0 items-center justify-center rounded-full bg-positive-soft text-sm font-semibold text-positive focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        aria-label="Sua conta"
      >
        {{ initials || '·' }}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="min-w-48">
        <DropdownMenuLabel v-if="name" class="truncate font-medium">{{ name }}</DropdownMenuLabel>
        <DropdownMenuSeparator v-if="name" />
        <DropdownMenuItem :disabled="isLoggingOut" @select="logout">
          <LogOut class="size-4" />{{ isLoggingOut ? 'Saindo…' : 'Sair' }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
