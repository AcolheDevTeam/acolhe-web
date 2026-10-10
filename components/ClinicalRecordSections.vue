<script setup lang="ts">
import { RECORD_SECTIONS } from '~/schemas/session'

// Leitura do prontuário de uma sessão (ACO-101): as seções preenchidas, com
// título, e o texto livre dos registros antigos como "Anotações". Usado na
// sessão concluída, na ficha e no "Meu prontuário" da paciente.
const props = withDefaults(defineProps<{
  demand?: string | null
  evolution?: string | null
  conduct?: string | null
  referral?: string | null
  notes?: string | null
  // Títulos como na tela da paciente ("Evolução") ou da psicóloga ("Evolução desta sessão").
  audience?: 'psychologist' | 'patient'
  emptyText?: string
}>(), { audience: 'psychologist', emptyText: 'Nada registrado nesta sessão.' })

const patientLabels: Record<string, string> = { evolution: 'Evolução' }

const filled = computed(() => {
  const items: { key: string, label: string, text: string }[] = RECORD_SECTIONS
    .map(section => ({
      key: section.key,
      label: props.audience === 'patient' ? (patientLabels[section.key] ?? section.label) : section.label,
      text: props[section.key] ?? '',
    }))
  if (props.notes) items.push({ key: 'notes', label: 'Anotações', text: props.notes })
  return items.filter(item => item.text.trim() !== '')
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <section v-for="item in filled" :key="item.key" class="flex flex-col gap-1.5" :aria-label="item.label">
      <h3 class="label-mono">{{ item.label }}</h3>
      <p class="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{{ item.text }}</p>
    </section>
    <p v-if="!filled.length" class="text-sm text-muted-foreground">{{ emptyText }}</p>
  </div>
</template>
