<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed } from "vue"
import { cn } from "@/lib/utils"

// Status de salvamento em mono no cabeçalho de formulários
// ("Salvando…", "Salvo · versão 3").
const props = defineProps<{
  state: "idle" | "dirty" | "saving" | "saved" | "error"
  version?: number | null
  class?: HTMLAttributes["class"]
}>()

const text = computed(() => {
  switch (props.state) {
    case "dirty": return "Alterações não salvas"
    case "saving": return "Salvando…"
    case "saved": return props.version ? `Salvo · versão ${props.version}` : "Salvo"
    case "error": return "Não foi possível salvar"
    default: return ""
  }
})
</script>

<template>
  <!-- Sempre montado: a região live precisa existir antes da primeira mensagem. -->
  <p
    role="status"
    aria-live="polite"
    :class="cn(
      'font-mono text-xs',
      state === 'error' ? 'text-destructive' : 'text-muted-foreground',
      props.class,
    )"
  >
    {{ text }}
  </p>
</template>
