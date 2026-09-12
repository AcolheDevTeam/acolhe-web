<script setup lang="ts">
import { BookMarked, User } from 'lucide-vue-next'
import type { ActivityTemplateSummary } from '~/schemas/activity-template'
import { Badge } from '@/components/ui/badge'

// Card da biblioteca de templates (tela 11 do design): tipo base, versão,
// título, resumo dos campos e origem. Clicável inteiro.
const { template } = defineProps<{ template: ActivityTemplateSummary }>()

const fieldSummary = computed(() =>
  summarizeFields([], template.fieldCount),
)
</script>

<template>
  <NuxtLink
    :to="`/templates/${template.id}`"
    class="flex flex-col gap-3 rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
  >
    <div class="flex items-center justify-between gap-2">
      <Badge variant="secondary" class="font-normal">{{ templateTypeLabel(template.type) }}</Badge>
      <span class="text-xs tabular-nums text-muted-foreground">v{{ template.version }}</span>
    </div>
    <div class="min-w-0">
      <p class="truncate font-medium">{{ template.title }}</p>
      <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {{ template.description || fieldSummary }}
      </p>
    </div>
    <div class="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
      <span class="inline-flex items-center gap-1.5">
        <BookMarked v-if="template.isGlobal" class="size-3.5" />
        <User v-else class="size-3.5" />
        {{ templateOriginLabel(template) }}
      </span>
      <span v-if="template.description">{{ fieldSummary }}</span>
    </div>
  </NuxtLink>
</template>
