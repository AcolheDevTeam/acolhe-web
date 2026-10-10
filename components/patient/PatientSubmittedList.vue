<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import type { PatientSubmittedActivity } from '~/schemas/patient-activity'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Atividades que a paciente já enviou (protótipo "Atividades da paciente", aba
// Enviadas). O cartão leva às respostas dela; o comentário da psicóloga, quando
// compartilhado, abre no próprio cartão.
defineProps<{ activities: PatientSubmittedActivity[] }>()

const open = ref<string | null>(null)
function toggle(id: string) {
  open.value = open.value === id ? null : id
}
</script>

<template>
  <ul v-if="activities.length" class="flex flex-col gap-3" aria-label="Atividades enviadas">
    <li
      v-for="(activity, index) in activities"
      :key="activity.id"
      class="animate-fade overflow-hidden rounded-[14px] border bg-card"
      :style="{ animationDelay: `${index * 60}ms` }"
    >
      <NuxtLink
        :to="`/patient/activities/${activity.id}`"
        class="flex items-center gap-3 p-4 transition-colors duration-300 hover:bg-secondary/40"
      >
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <span class="flex flex-wrap items-center gap-2">
            <span class="text-[15px] font-semibold">{{ activity.title }}</span>
            <Badge :variant="submittedStatusMeta(activity.status).variant">{{ submittedStatusMeta(activity.status).label }}</Badge>
          </span>
          <span class="text-[13px] text-muted-foreground">Enviada em {{ formatDayMonth(activity.submittedAt) }}</span>
        </span>
        <ChevronRight class="size-[18px] shrink-0 text-muted-foreground" :stroke-width="1.8" aria-hidden="true" />
      </NuxtLink>
      <div v-if="activity.comment" class="border-t px-4 pb-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          class="-ml-2 gap-1 text-primary hover:text-primary"
          :aria-expanded="open === activity.id"
          :aria-controls="`comentario-${activity.id}`"
          @click="toggle(activity.id)"
        >
          {{ open === activity.id ? 'Ocultar comentário' : 'Ver comentário da sua psicóloga' }}
          <ChevronDown :class="['size-4 transition-transform duration-300', open === activity.id ? 'rotate-180' : '']" aria-hidden="true" />
        </Button>
        <div
          v-if="open === activity.id"
          :id="`comentario-${activity.id}`"
          class="animate-fade mt-2 flex flex-col gap-1.5 rounded-xl bg-accent px-4 py-3"
        >
          <span class="label-mono">Comentário da sua psicóloga · {{ formatDayMonth(activity.comment.updatedAt) }}</span>
          <p class="whitespace-pre-line break-words text-sm leading-relaxed">{{ activity.comment.text }}</p>
        </div>
      </div>
    </li>
  </ul>
  <EmptyState v-else compact>
    Nenhuma atividade enviada ainda. Quando você responder uma, ela aparece aqui.
  </EmptyState>
</template>
