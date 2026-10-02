<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const sessionId = computed(() => route.params.id as string)
const { data: session, error, refresh } = useSession(sessionId)
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
      <Badge v-if="session" variant="secondary" class="gap-1">
        <Check class="size-3" />
        Prontuário
      </Badge>
      <RecordExportButton />
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

      <Button v-if="session.appointmentId" variant="outline" class="self-start" as-child>
        <NuxtLink :to="`/appointments/${session.appointmentId}`">Ver agendamento</NuxtLink>
      </Button>
      <SessionNotesForm :key="session.id" :session="session" @saved="session = $event" @reload="refresh()" />
    </div>

    <div v-else-if="error" class="text-sm">
      <p>{{ apiErrorMessage(error, { 404: 'Sessão não encontrada.', default: 'Não foi possível carregar a sessão agora.' }) }}</p>
      <Button variant="outline" class="mt-3" @click="refresh()">Tentar novamente</Button>
    </div>
    <div v-else class="flex flex-col gap-3">
      <Skeleton class="h-8 w-64" />
      <Skeleton class="h-4 w-40" />
      <Skeleton class="mt-4 h-32 w-full" />
    </div>
  </div>
</template>
