<script setup lang="ts">
import { Button } from '@/components/ui/button'
defineProps<{
  page: number
  totalPages: number
  totalCount: number
  busy?: boolean
}>()
defineEmits<{ change: [page: number] }>()
</script>
<template>
  <nav
    aria-label="Paginação"
    class="flex flex-wrap items-center justify-between gap-3 text-sm"
  >
    <span class="text-muted-foreground"
      >{{ totalCount }} itens ·
      {{
        totalPages ? `Página ${page} de ${totalPages}` : 'Nenhuma página'
      }}</span
    >
    <div class="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="busy || page <= 1"
        @click="$emit('change', page - 1)"
        >Anterior</Button
      ><Button
        variant="outline"
        size="sm"
        :disabled="busy || page >= totalPages"
        @click="$emit('change', page + 1)"
        >Próxima</Button
      >
    </div>
  </nav>
</template>
