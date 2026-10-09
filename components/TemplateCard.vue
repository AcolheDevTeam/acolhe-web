<script setup lang="ts">
import { Archive } from 'lucide-vue-next'
import type { ActivityTemplateSummary } from '~/schemas/activity-template'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Card da biblioteca de templates (protótipo "Templates"): tipo · versão,
// título, resumo dos campos, escopo e as ações Enviar e Editar. Arquivar fica
// no ícone do topo, só para a autora.
const { template } = defineProps<{ template: ActivityTemplateSummary }>()

const fieldSummary = computed(() => summarizeFields([], template.fieldCount))
const scope = computed(() => templateScope(template))
// Tons do chip de escopo no protótipo: pessoal índigo claro, clínica neutro,
// biblioteca Acolhe em Noite.
const scopeVariant = computed(() => ({ mine: 'positive', clinic: 'neutral', acolhe: 'strong' } as const)[scope.value])
</script>

<template>
  <article class="group relative flex flex-col gap-3.5 rounded-2xl border bg-card p-5 transition-[transform,box-shadow,border-color] duration-[400ms] ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-[3px] hover:border-input hover:shadow-[0_14px_32px_rgba(22,26,58,.08)] motion-reduce:hover:translate-y-0">
    <div class="flex min-h-9 items-center justify-between gap-2">
      <span class="label-mono tracking-[0.1em]">{{ templateTypeLabel(template.type) }} · v{{ template.version }}</span>
      <ArchiveTemplateDialog v-if="template.ownedByMe" :template="template">
        <Button variant="ghost" size="icon-sm" class="relative z-[1] -mr-2 text-muted-foreground" :aria-label="`Arquivar ${template.title}`">
          <Archive />
        </Button>
      </ArchiveTemplateDialog>
    </div>

    <div class="flex min-w-0 flex-col gap-1.5">
      <h2 class="text-lg font-semibold leading-snug tracking-[-0.01em]">
        <!-- O título leva ao detalhe; a área do card inteira é clicável. -->
        <NuxtLink
          :to="`/templates/${template.id}`"
          class="rounded-sm after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-primary/15"
        >
          {{ template.title }}
        </NuxtLink>
      </h2>
      <p class="line-clamp-2 text-sm text-secondary-foreground">
        {{ template.description || fieldSummary }}
      </p>
    </div>

    <div class="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-secondary pt-3.5">
      <Badge :variant="scopeVariant" class="h-6">{{ templateOriginLabel(template) }}</Badge>
      <span v-if="template.description" class="text-[13px] text-muted-foreground">{{ fieldSummary }}</span>
    </div>

    <div class="relative z-[1] flex gap-2">
      <AssignActivityDialog :template-id="template.id">
        <Button variant="outline" size="sm" class="flex-1">Enviar</Button>
      </AssignActivityDialog>
      <Button variant="outline" size="sm" class="flex-1" as-child>
        <NuxtLink :to="`/templates/${template.id}`">{{ template.ownedByMe ? 'Editar' : 'Ver' }}</NuxtLink>
      </Button>
    </div>
  </article>
</template>
