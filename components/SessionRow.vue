<script setup lang="ts">
import type { Session } from '~/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const { session } = defineProps<{ session: Session }>()
const meta = computed(() => sessionStatusMeta(session.status))
</script>

<template>
  <NuxtLink
    :to="`/sessions/${session.id}`"
    class="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40"
  >
    <span class="w-12 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
      {{ formatTime(session.occurredAt) }}
    </span>
    <Avatar class="size-8">
      <AvatarFallback class="bg-secondary text-xs">{{ initials(session.patientName) }}</AvatarFallback>
    </Avatar>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium">{{ session.patientName ?? 'Paciente' }}</p>
      <p class="text-xs text-muted-foreground">
        <template v-if="session.modality || session.durationMin">
          {{ modalityLabel(session.modality) }}<template v-if="session.durationMin"> · {{ session.durationMin }}min</template>
        </template>
        <template v-else>Sessão clínica</template>
      </p>
    </div>
    <Badge :variant="meta.variant">{{ meta.label }}</Badge>
  </NuxtLink>
</template>
