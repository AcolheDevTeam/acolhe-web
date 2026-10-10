<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

// Carregando / erro das telas do portal da paciente. O conteúdo vai no slot e
// só aparece quando os dados chegaram. `errorTitle`/`errorText` e o slot
// `error-action` trocam o texto e as ações padrão quando a tela sabe a causa.
defineProps<{ pending: boolean, error: unknown, errorTitle?: string, errorText?: string }>()
</script>

<template>
  <div v-if="pending" class="flex flex-col gap-4" aria-live="polite" aria-label="Carregando seu espaço">
    <Skeleton v-for="item in 3" :key="item" class="h-32 rounded-2xl" />
  </div>
  <EmptyState v-else-if="error" :title="errorTitle ?? 'Não foi possível carregar seu espaço.'">
    {{ errorText ?? 'Sua sessão pode ter expirado ou o serviço está indisponível.' }}
    <template #action>
      <slot name="error-action">
        <Button variant="outline" @click="() => refreshNuxtData()"><RefreshCw class="size-4" />Tentar novamente</Button>
        <Button variant="ghost" @click="navigateTo('/login')">Voltar ao login</Button>
      </slot>
    </template>
  </EmptyState>
  <slot v-else />
</template>
