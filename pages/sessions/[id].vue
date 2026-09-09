<script setup lang="ts">
import { Check, Download } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const sessionId = computed(() => route.params.id as string)
const { data: session } = useSession(sessionId)
</script>

<template>
  <PageHeader>
    <template #title>
      <nav class="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <!-- No celular só o trecho final do caminho aparece. -->
        <NuxtLink to="/patients" class="hidden hover:text-foreground sm:inline">Pacientes</NuxtLink>
        <span class="hidden sm:inline">/</span>
        <NuxtLink
          v-if="session?.patientId"
          :to="`/patients/${session.patientId}/sessions`"
          class="hover:text-foreground"
        >
          {{ session?.patientName ?? 'Paciente' }}
        </NuxtLink>
        <span>/</span>
        <span class="min-w-0 truncate font-medium text-foreground">Prontuário</span>
      </nav>
    </template>
    <template #actions>
      <Badge variant="secondary" class="gap-1">
        <Check class="size-3" />
        Salvo
      </Badge>
      <Button variant="outline" size="sm">
        <Download />
        Exportar
      </Button>
    </template>
  </PageHeader>

  <div class="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
    <div v-if="session" class="flex flex-col gap-6">
      <div class="flex flex-col gap-1">
        <h1 class="display-serif text-3xl">
          Sessão {{ session.number ?? '' }} · {{ formatDate(session.occurredAt) }}
        </h1>
        <p class="text-sm text-muted-foreground">
          <template v-if="session.modality">{{ modalityLabel(session.modality) }} · </template>
          <template v-if="session.durationMin">{{ session.durationMin }} min · </template>
          {{ formatTime(session.occurredAt) }}
        </p>
      </div>

      <section class="flex flex-col gap-2">
        <p class="label-mono">Evolução da sessão</p>
        <p class="whitespace-pre-line text-sm leading-relaxed">
          {{ session.notes || 'Sem registro para esta sessão.' }}
        </p>
      </section>
    </div>

    <div v-else class="flex flex-col gap-3">
      <Skeleton class="h-8 w-64" />
      <Skeleton class="h-4 w-40" />
      <Skeleton class="mt-4 h-32 w-full" />
    </div>
  </div>
</template>
