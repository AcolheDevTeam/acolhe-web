<script setup lang="ts">
import { toast } from 'vue-sonner'
import { CustomDropdown } from '@/components/ui/custom-dropdown'

// Troca de workspace no menu, só para quem tem mais de um vínculo ativo.
const { workspaces, switching, switchTo } = useWorkspaces()
const active = computed(() => workspaces.value.filter(w => w.membershipStatus === 'active' && w.organizationStatus === 'active'))
const current = computed(() => workspaces.value.find(w => w.current))
const options = computed(() => active.value.map(w => ({
  value: w.organizationId,
  label: w.name,
  description: `${workspaceTypeLabel(w.type)} · ${w.roles.map(workspaceRoleLabel).join(', ')}`,
})))

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
  <div v-if="active.length > 1" class="px-3 pb-3">
    <p class="label-mono px-1 pb-1">Espaço de trabalho</p>
    <CustomDropdown
      :model-value="current?.organizationId"
      :options="options"
      :disabled="switching !== null"
      placeholder="Escolha o espaço"
      search-placeholder="Buscar espaço…"
      aria-label="Trocar de espaço de trabalho"
      @update:model-value="onChange"
    />
  </div>
</template>
