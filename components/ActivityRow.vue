<script setup lang="ts">
import type { Activity } from '~/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const { activity, showPatient } = defineProps<{
  activity: Activity
  showPatient?: boolean
}>()
</script>

<template>
  <div class="flex items-center gap-4 rounded-lg border bg-card px-4 py-3">
    <Avatar v-if="showPatient" class="size-8">
      <AvatarFallback class="bg-secondary text-xs">{{ initials(activity.patientName) }}</AvatarFallback>
    </Avatar>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium">{{ activity.title }}</p>
      <p class="truncate text-xs text-muted-foreground">
        <template v-if="showPatient && activity.patientName">{{ activity.patientName }} · </template>{{ activitySummary(activity) }}
      </p>
    </div>
    <Button v-if="activity.status === 'submitted'" variant="outline" size="sm" as-child>
      <NuxtLink :to="`/activities/${activity.id}`">Revisar</NuxtLink>
    </Button>
  </div>
</template>
