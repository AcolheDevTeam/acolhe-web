<script setup lang="ts">
import type { Activity } from '~/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Linha de atividade no padrão `.item` do protótipo (Fila de atividades): fica
// dentro de um Card, separada por divisória. Com `showPatient` a linha abre com
// a paciente; sem ele (ficha da paciente) o título da atividade vem primeiro.
const { activity, showPatient } = defineProps<{
  activity: Activity
  showPatient?: boolean
}>()

const badge = computed(() => activityQueueBadge(activity))
const overdue = computed(() => isActivityOverdue(activity))
const canReview = computed(() => activity.status === 'submitted')
const isReviewed = computed(() => activity.status === 'reviewed')
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-secondary px-4 py-3.5 transition-colors duration-200 last:border-b-0 hover:bg-surface-subtle"
  >
    <Avatar v-if="showPatient" class="size-9 text-xs" aria-hidden="true">
      <AvatarFallback>{{ initials(activity.patientName) }}</AvatarFallback>
    </Avatar>
    <span class="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
      <span class="truncate text-[15px] font-semibold">
        {{ showPatient ? (activity.patientName ?? activity.title) : activity.title }}
      </span>
      <span v-if="showPatient" class="truncate text-[13px] text-muted-foreground">{{ activity.title }}</span>
    </span>
    <span
      class="min-w-0 flex-[0_1_220px] text-[13px]"
      :class="overdue ? 'font-medium text-destructive' : 'text-foreground'"
    >
      {{ activitySummary(activity) }}
    </span>
    <Badge :variant="badge.variant">{{ badge.label }}</Badge>
    <span
      class="ml-auto justify-end sm:ml-0 sm:flex sm:flex-[0_0_150px]"
      :class="canReview || isReviewed ? 'flex' : 'hidden'"
    >
      <Button v-if="canReview" size="sm" as-child>
        <NuxtLink :to="`/activities/${activity.id}`">Revisar</NuxtLink>
      </Button>
      <NuxtLink
        v-else-if="isReviewed"
        :to="`/activities/${activity.id}`"
        class="text-[13px] text-primary underline underline-offset-[3px] hover:text-brand"
      >
        Ver resposta
      </NuxtLink>
    </span>
  </div>
</template>
