<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const activityId = computed(() => route.params.id as string)
const { data: activity } = useActivity(activityId)

const meta = computed(() => activityStatusMeta(activity.value?.status))
const reviewing = ref(false)

async function markReviewed() {
  reviewing.value = true
  try {
    await $fetch(`/api/activities/${activityId.value}`, {
      method: 'PATCH',
      body: { status: 'reviewed' },
    })
    toast.success('Atividade marcada como revisada.')
    await refreshNuxtData(`activity-${activityId.value}`)
  } catch {
    toast.error('Não foi possível concluir a revisão.')
  } finally {
    reviewing.value = false
  }
}
</script>

<template>
  <PageHeader>
    <template #title>
      <nav class="flex items-center gap-2 text-sm text-muted-foreground">
        <NuxtLink to="/patients" class="hover:text-foreground">Pacientes</NuxtLink>
        <span>/</span>
        <NuxtLink
          v-if="activity?.patientId"
          :to="`/patients/${activity.patientId}/activities`"
          class="hover:text-foreground"
        >
          {{ activity?.patientName ?? 'Paciente' }}
        </NuxtLink>
        <span>/</span>
        <span class="font-medium text-foreground">Atividade</span>
      </nav>
    </template>
    <template #actions>
      <Button
        v-if="activity?.status === 'submitted'"
        size="sm"
        :disabled="reviewing"
        @click="markReviewed"
      >
        <Check />
        Marcar como revisada
      </Button>
    </template>
  </PageHeader>

  <div class="mx-auto w-full max-w-2xl px-8 py-8">
    <div v-if="activity" class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <h1 class="display-serif text-3xl">{{ activity.title }}</h1>
          <Badge :variant="meta.variant">{{ meta.label }}</Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          <template v-if="activity.patientName">{{ activity.patientName }} · </template>
          <template v-if="activity.respondedAt">respondida em {{ formatDateTime(activity.respondedAt) }}</template>
          <template v-else-if="activity.dueAt">prazo {{ formatDateTime(activity.dueAt) }}</template>
        </p>
      </div>

      <section class="flex flex-col gap-2">
        <p class="label-mono">Resposta</p>
        <p class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {{ activity.summary || (activity.status === 'submitted' || activity.status === 'reviewed'
            ? 'Resposta submetida. O conteúdo estruturado ainda não está disponível nesta tela.'
            : 'A paciente ainda não respondeu esta atividade.') }}
        </p>
      </section>
    </div>

    <div v-else class="flex flex-col gap-3">
      <Skeleton class="h-8 w-64" />
      <Skeleton class="h-4 w-40" />
      <Skeleton class="mt-4 h-24 w-full" />
    </div>
  </div>
</template>
