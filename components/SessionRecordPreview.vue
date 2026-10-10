<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Prontuário de uma sessão, só leitura, em seções (ACO-101). Na ficha mostra a
// sessão mais recente; a edição acontece na página da sessão.
const props = defineProps<{ sessionId: string, heading?: string }>()
const { data: session, error, refresh } = useSession(() => props.sessionId)

const meta = computed(() => {
  const s = session.value
  if (!s) return ''
  return [
    s.modality ? modalityLabel(s.modality) : null,
    s.durationMin ? `${s.durationMin} min` : null,
  ].filter(Boolean).join(' · ')
})
const state = computed(() => {
  const s = session.value
  if (!s) return ''
  return `${s.locked ? 'Concluída' : 'Em registro'} · versão ${s.version ?? 1}`
})
</script>

<template>
  <Card role="region" :aria-label="heading ?? 'Prontuário da sessão'" class="flex flex-col gap-5 p-6">
    <template v-if="session">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold tracking-[-0.02em]">
            {{ heading ?? 'Sessão' }} · {{ formatDate(session.occurredAt) }}
          </h2>
          <p v-if="meta" class="text-sm text-muted-foreground">{{ meta }}</p>
        </div>
        <span class="font-mono text-xs text-muted-foreground">{{ state }}</span>
      </div>
      <ClinicalRecordSections
        :demand="session.demand"
        :evolution="session.evolution"
        :conduct="session.conduct"
        :referral="session.referral"
        :notes="session.notes"
      />
      <Button variant="outline" class="self-start" as-child>
        <NuxtLink :to="`/sessions/${session.id}`">
          {{ session.locked ? 'Abrir sessão' : 'Continuar registro' }}
          <ArrowRight aria-hidden="true" />
        </NuxtLink>
      </Button>
    </template>
    <div v-else-if="error" role="alert" class="text-sm">
      <p>{{ apiErrorMessage(error, { 404: 'Sessão não encontrada.', default: 'Não foi possível carregar o prontuário desta sessão.' }) }}</p>
      <Button variant="outline" class="mt-2" @click="refresh()">Tentar novamente</Button>
    </div>
    <div v-else class="flex flex-col gap-3">
      <Skeleton class="h-6 w-56" />
      <Skeleton class="h-16 w-full" />
    </div>
  </Card>
</template>
