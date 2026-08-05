<script setup lang="ts">
import type { TimelineEvent } from '~/types'

const { patientId } = defineProps<{ patientId: string }>()

const { data: timeline, error } = await useFetch<TimelineEvent[]>(
  `/api/patients/${patientId}/timeline`,
  {
    key: `timeline-${patientId}`,
  },
)
</script>

<template>
  <section class="flex flex-col gap-3">
    <p class="label-mono">Linha do tempo</p>
    <p
      v-if="error"
      class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
    >
      Não foi possível carregar a linha do tempo.
    </p>
    <ol v-else-if="timeline?.length" class="flex flex-col">
      <li
        v-for="(event, index) in timeline"
        :key="event.id"
        class="flex gap-4 border-l border-border pb-6 pl-4 last:pb-0"
        :class="{ 'border-transparent': index === timeline.length - 1 }"
      >
        <div class="flex flex-col gap-0.5">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">{{ event.title }}</span>
            <span class="text-xs text-muted-foreground">{{ formatDateTime(event.at) }}</span>
          </div>
          <p v-if="event.description" class="text-sm text-muted-foreground">
            {{ event.description }}
          </p>
          <p v-if="event.by" class="text-xs text-muted-foreground">por {{ event.by }}</p>
        </div>
      </li>
    </ol>
    <p
      v-else
      class="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
    >
      Ainda não há eventos na linha do tempo.
    </p>
  </section>
</template>
