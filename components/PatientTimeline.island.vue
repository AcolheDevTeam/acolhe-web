<script setup lang="ts">
import type { TimelineEvent } from '~/types'
import { Card } from '@/components/ui/card'

const { patientId } = defineProps<{ patientId: string }>()

const { data: timeline, error } = await useFetch<TimelineEvent[]>(
  `/api/patients/${patientId}/timeline`,
  {
    key: `timeline-${patientId}`,
  },
)

// Cor do marcador por tipo de evento (protótipo): sessão em índigo, atividade
// em índigo claro, o resto em cinza.
function dotClass(type: string) {
  if (type === 'session') return 'bg-primary'
  if (type === 'activity') return 'bg-mood-3'
  return 'bg-input-hover'
}

function metaOf(event: TimelineEvent) {
  return [event.description, event.by ? `por ${event.by}` : null].filter(Boolean).join(' · ')
}
</script>

<template>
  <Card role="region" aria-labelledby="ficha-linha-do-tempo" class="flex flex-col gap-1 p-6">
    <h2 id="ficha-linha-do-tempo" class="label-mono mb-3">Linha do tempo</h2>
    <EmptyState
      v-if="error" compact>
      Não foi possível carregar a linha do tempo.
    </EmptyState>
    <ol v-else-if="timeline?.length" class="flex flex-col">
      <li
        v-for="(event, index) in timeline"
        :key="event.id"
        class="animate-fade grid grid-cols-[20px_minmax(0,1fr)_auto] gap-3.5 py-2.5"
        :style="{ animationDelay: `${Math.min(index, 8) * 60}ms` }"
      >
        <span aria-hidden="true" class="ml-1 mt-[5px] size-2.5 rounded-full" :class="dotClass(event.type)" />
        <span class="flex min-w-0 flex-col gap-0.5">
          <span class="text-[15px] font-medium">{{ event.title }}</span>
          <span v-if="metaOf(event)" class="text-[13px] text-muted-foreground">{{ metaOf(event) }}</span>
        </span>
        <time :datetime="event.at" :title="formatDateTime(event.at)" class="font-mono text-xs text-muted-foreground">
          {{ timelineWhenLabel(event.at) }}
        </time>
      </li>
    </ol>
    <EmptyState
      v-else compact>
      Ainda não há eventos na linha do tempo.
    </EmptyState>
  </Card>
</template>
