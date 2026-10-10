<script setup lang="ts">
import { Button } from '@/components/ui/button'

// Barra "Alterações não salvas" do protótipo "Perfil": fixa no rodapé,
// centralizada, em Noite, com Descartar e Salvar. Genérica para qualquer
// formulário de edição com salvamento explícito.
defineProps<{ saving?: boolean }>()
const emit = defineEmits<{ discard: [], save: [] }>()
</script>

<template>
  <!-- O wrapper centraliza; a animação de entrada mexe no transform da barra. -->
  <div class="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center px-4">
    <div
      role="region"
      aria-label="Alterações não salvas"
      class="animate-rise pointer-events-auto flex w-full max-w-[560px] items-center gap-2 sm:gap-3 rounded-[14px] bg-brand py-3 pl-5 pr-3 text-brand-foreground shadow-[0_18px_40px_rgba(22,26,58,.24)]"
    >
      <span class="min-w-0 flex-1 text-sm font-medium">Alterações não salvas</span>
      <Button variant="on-brand-outline" class="border-0" :disabled="saving" @click="emit('discard')">Descartar</Button>
      <Button :loading="saving" @click="emit('save')">{{ saving ? 'Salvando…' : 'Salvar' }}</Button>
    </div>
  </div>
</template>
