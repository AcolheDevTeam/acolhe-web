<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

// Carregando / erro das telas do portal da paciente. O conteúdo vai no slot e
// só aparece quando os dados chegaram.
defineProps<{ pending: boolean, error: unknown }>()
</script>

<template>
  <div v-if="pending" class="flex flex-col gap-4" aria-live="polite" aria-label="Carregando seu espaço">
    <Skeleton v-for="item in 3" :key="item" class="h-32 rounded-2xl" />
  </div>
  <EmptyState v-else-if="error" title="Não foi possível carregar seu espaço.">
    Sua sessão pode ter expirado ou o serviço está indisponível.
    <template #action>
      <Button variant="outline" @click="() => refreshNuxtData()"><RefreshCw class="size-4" />Tentar novamente</Button>
      <Button variant="ghost" @click="navigateTo('/login')">Voltar ao login</Button>
    </template>
  </EmptyState>
  <slot v-else />
</template>
