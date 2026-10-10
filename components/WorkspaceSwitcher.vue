<script setup lang="ts">
import { ChevronsUpDown } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { CustomDropdown } from '@/components/ui/custom-dropdown'

// Troca de workspace no menu, só para quem tem mais de um vínculo ativo.
const { workspaces, switching, switchTo } = useWorkspaces()
const config = useRuntimeConfig()
const active = computed(() => workspaces.value.filter(w => w.membershipStatus === 'active' && w.organizationStatus === 'active'))
const current = computed(() => workspaces.value.find(w => w.current))
const options = computed(() => active.value.map(w => ({
  value: w.organizationId,
  label: w.name,
  description: `${workspaceTypeLabel(w.type)} · ${w.roles.map(workspaceRoleLabel).join(', ')}`,
})))
const initials = computed(() => (current.value?.name ?? '')
  .split(' ')
  .map(p => p[0])
  .filter(Boolean)
  .slice(0, 2)
  .join('')
  .toUpperCase())

async function onChange(organizationId: string) {
  if (!organizationId || organizationId === current.value?.organizationId) return
  try {
    await switchTo(organizationId)
  }
  catch (error) {
    toast.error(apiErrorMessage(error, { 403: 'Este espaço de trabalho não está disponível para você.', default: 'Não foi possível trocar de espaço agora.' }))
  }
}
</script>

<template>
  <CustomDropdown
    v-if="active.length > 1"
    :model-value="current?.organizationId"
    :options="options"
    :disabled="switching !== null"
    placeholder="Escolha o espaço"
    search-placeholder="Buscar espaço…"
    aria-label="Trocar de espaço de trabalho"
    class="h-auto gap-2.5 rounded-xl border-border bg-card px-3 py-2.5 shadow-none hover:border-input"
    content-class="min-w-56"
    @update:model-value="onChange"
  >
    <template #trigger>
      <span aria-hidden="true" class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-[13px] font-semibold text-highlight">{{ initials }}</span>
      <span class="flex min-w-0 flex-1 flex-col text-start">
        <span class="truncate text-sm font-semibold text-foreground">{{ current?.name ?? 'Escolha o espaço' }}</span>
        <span class="text-xs text-muted-foreground">Trocar espaço</span>
      </span>
      <ChevronsUpDown class="size-4 shrink-0 text-muted-foreground" />
    </template>
  </CustomDropdown>
  <NuxtLink
    v-if="config.public.clinicSelfSignupEnabled"
    to="/clinica/criar"
    class="mt-2 flex min-h-10 items-center rounded-lg px-3 text-sm text-secondary-foreground transition-colors hover:bg-muted hover:text-foreground"
  >
    Criar clínica
  </NuxtLink>
</template>
