<script setup lang="ts">
import { ArrowRight, FileLock2 } from 'lucide-vue-next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const sessionId = computed(() => route.params.id as string)
const { data: session, error, refresh } = useSession(sessionId)

// Estado do salvamento vem do formulário; o cabeçalho só exibe ("Salvo · versão N").
const saveState = ref<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle')

const sessionTitle = computed(() => session.value?.number ? `Sessão ${session.value.number}` : 'Sessão')
const crumbs = computed(() => [
  { label: 'Pacientes', to: '/patients', hideOnMobile: true },
  ...(session.value?.patientId
    ? [{ label: session.value.patientName ?? 'Paciente', to: `/patients/${session.value.patientId}` }]
    : []),
  { label: sessionTitle.value },
])

// Dados da sessão em card (protótipo): só o que a API devolve.
const details = computed(() => {
  const s = session.value
  if (!s) return []
  return [
    { label: 'Data', value: formatDateTime(s.occurredAt) },
    s.durationMin ? { label: 'Duração', value: `${s.durationMin} min` } : null,
    s.modality ? { label: 'Modalidade', value: modalityLabel(s.modality) } : null,
    { label: 'Situação', value: sessionStatusMeta(s.status).label },
  ].filter(Boolean) as { label: string, value: string }[]
})
</script>

<template>
  <PageHeader>
    <template #title>
      <!-- No celular só o trecho final do caminho aparece. -->
      <Breadcrumb :items="crumbs" />
    </template>
    <template #actions>
      <RecordExportButton />
    </template>
  </PageHeader>

  <div class="flex w-full flex-col gap-6 px-4 pb-6 pt-6 md:px-8 md:pb-14 lg:px-12">
    <template v-if="session">
      <header class="flex animate-rise flex-wrap items-center justify-between gap-5 [animation-delay:.05s]">
        <div class="flex min-w-0 items-center gap-4">
          <Avatar tone="brand" class="h-[52px] w-[52px] text-lg text-highlight">
            <AvatarFallback>{{ initials(session.patientName) }}</AvatarFallback>
          </Avatar>
          <div class="min-w-0">
            <h1 class="text-[28px] font-semibold leading-tight tracking-[-0.03em]">
              {{ sessionTitle }}<template v-if="session.patientName"> · {{ session.patientName }}</template>
            </h1>
            <p class="mt-1 text-sm text-muted-foreground">Prontuário visível para o(a) paciente</p>
          </div>
        </div>
        <SaveStatus :state="saveState" :version="session.version" />
      </header>

      <Card
        role="region"
        aria-label="Dados da sessão"
        class="grid animate-rise grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 px-[22px] py-[18px] [animation-delay:.1s]"
      >
        <div v-for="item in details" :key="item.label" class="flex flex-col gap-1">
          <span class="label-mono">{{ item.label }}</span>
          <span class="text-[15px] font-medium">{{ item.value }}</span>
        </div>
        <div v-if="session.appointmentId" class="flex flex-col gap-1">
          <span class="label-mono">Agendamento</span>
          <NuxtLink
            :to="`/appointments/${session.appointmentId}`"
            class="text-[15px] font-medium text-primary underline-offset-[3px] hover:underline"
          >
            Ver agendamento
          </NuxtLink>
        </div>
      </Card>

      <SessionRecordForm
        :key="session.id"
        :session="session"
        :title="sessionTitle"
        @saved="session = $event"
        @reload="refresh()"
        @status="saveState = $event"
      >
        <template #aside>
          <!-- Bloco escuro do protótipo. O caderno fica na ficha da paciente;
               aqui só o atalho, sem editor duplicado. -->
          <section
            aria-labelledby="t-rd"
            class="flex animate-rise flex-col gap-3.5 rounded-2xl bg-brand p-[22px] text-brand-foreground [animation-delay:.2s]"
          >
            <div class="flex items-center gap-2">
              <FileLock2 class="size-4 text-highlight" aria-hidden="true" />
              <h2 id="t-rd" class="label-mono text-brand-foreground/80">Registro Documental · só você</h2>
            </div>
            <p class="text-sm leading-relaxed text-brand-muted">
              Hipóteses, observações técnicas e planejamento ficam no caderno do(a) paciente.
              Não aparece para o(a) paciente nem na exportação de dados dela(e).
            </p>
            <Button variant="on-brand-outline" class="self-start" as-child>
              <NuxtLink :to="`/patients/${session.patientId}/registry`">
                Abrir Registro Documental
                <ArrowRight aria-hidden="true" />
              </NuxtLink>
            </Button>
          </section>

          <Card
            role="region"
            aria-labelledby="t-next"
            class="flex animate-rise flex-col gap-3.5 p-[22px] [animation-delay:.25s]"
          >
            <h2 id="t-next" class="label-mono">Atividade para a próxima semana</h2>
            <AssignActivityDialog :patient-id="session.patientId">
              <Button variant="outline" class="self-start">Atribuir atividade</Button>
            </AssignActivityDialog>
          </Card>
        </template>
      </SessionRecordForm>
    </template>

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
