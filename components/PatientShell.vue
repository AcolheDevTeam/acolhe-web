<script setup lang="ts">
import { Clock3, FileText, MoreHorizontal, Plus } from 'lucide-vue-next'
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
  active: 'overview' | 'sessions' | 'activities'
}>()

const tabs = computed(() => [
  { key: 'overview', label: 'Visão geral', to: `/patients/${patientId}` },
  { key: 'sessions', label: 'Prontuário', to: `/patients/${patientId}/sessions` },
  { key: 'activities', label: 'Atividades', to: `/patients/${patientId}/activities` },
].filter(tab => isActive.value || tab.key === 'overview'))

const isActive = computed(() =>
  patient?.status === 'active' && patient?.relationshipStatus === 'active',
)

const meta = computed(() => {
  const p = patient
  if (!p) return []
  return [
    p.age ? `${p.age} anos` : null,
    p.approach,
    p.approachSince ? `Vínculo ${p.approachSince}` : null,
  ].filter(Boolean) as string[]
})
</script>

<template>
  <PageHeader>
    <template #title>
      <nav class="flex items-center gap-2 text-sm text-muted-foreground">
        <NuxtLink to="/patients" class="hover:text-foreground">Pacientes</NuxtLink>
        <span>/</span>
        <span class="font-medium text-foreground">{{ patient?.fullName ?? '—' }}</span>
      </nav>
    </template>
    <template #actions>
      <Badge v-if="patient && !isActive" variant="secondary" class="gap-1.5">
        <Clock3 class="size-3" />
        Aguardando consentimento
      </Badge>
      <NewSessionDialog v-if="isActive" :patient-id="patientId">
        <Button variant="outline" size="sm">
          <FileText />
          Nova sessão
        </Button>
      </NewSessionDialog>
      <AssignActivityDialog v-if="isActive" :patient-id="patientId">
        <Button variant="outline" size="sm">
          <Plus />
          Atribuir atividade
        </Button>
      </AssignActivityDialog>
      <DropdownMenu v-if="isActive">
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem>Exportar dados (LGPD)</DropdownMenuItem>
            <DropdownMenuItem>Arquivar paciente</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
  </PageHeader>

  <div class="px-8 py-8">
    <!-- Perfil -->
    <div class="flex items-start gap-4">
      <Avatar class="size-16">
        <AvatarFallback class="bg-secondary text-lg">{{ initials(patient?.fullName) }}</AvatarFallback>
      </Avatar>
      <div class="flex flex-col gap-1">
        <h1 class="display-serif text-3xl">{{ patient?.fullName ?? '—' }}</h1>
        <p class="text-sm text-muted-foreground">{{ meta.join(' · ') }}</p>
        <p v-if="patient?.demand" class="mt-2 max-w-2xl text-sm leading-relaxed">
          <span class="font-medium">Demanda:</span>
          <span class="text-muted-foreground"> {{ patient.demand }}</span>
        </p>
      </div>
    </div>

    <div
      v-if="patient && !isActive"
      class="mt-6 flex items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm"
    >
      <Clock3 class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p class="text-muted-foreground">
        <span class="font-medium text-foreground">Vínculo ainda não ativado.</span>
        Sessões e atividades serão liberadas somente depois que a paciente aceitar o consentimento.
      </p>
    </div>

    <!-- Navegação (abas) -->
    <nav class="mt-6 flex gap-6 border-b">
      <NuxtLink
        v-for="t in tabs"
        :key="t.key"
        :to="t.to"
        :class="[
          '-mb-px border-b-2 pb-3 text-sm transition-colors',
          active === t.key
            ? 'border-foreground font-medium text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        ]"
      >
        {{ t.label }}
      </NuxtLink>
    </nav>

    <!-- Conteúdo -->
    <div class="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
      <div class="min-w-0">
        <slot />
      </div>
      <aside v-if="$slots.aside" class="flex flex-col gap-8">
        <slot name="aside" />
      </aside>
    </div>
  </div>
</template>
