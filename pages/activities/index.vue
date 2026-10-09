<script setup lang="ts">
import { ChevronDown, Plus } from 'lucide-vue-next'
import type { Activity } from '~/types'
import type { ActivityQueueTab } from '~/utils/activity-queue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

// Fila de atividades da psicóloga (protótipo "Atividades"): abas por situação,
// filtros por paciente e template, uma linha por atribuição. A situação vem
// dos status reais da API (utils/activity-queue.ts). Seleção múltipla,
// lembrete e encerrar ficam de fora: a API ainda não tem essas ações.
const { data: activities, status, error, refresh } = useActivities()

const all = computed(() => activities.value ?? [])

const ALL = 'all'
const route = useRoute()
const router = useRouter()

// A aba fica na URL para o breadcrumb da revisão conseguir voltar para ela.
const tab = computed<ActivityQueueTab>({
  get: () => (isActivityQueueTab(route.query.tab) ? route.query.tab : 'review'),
  set: (value) => router.replace({ query: { ...route.query, tab: value === 'review' ? undefined : value } }),
})

const patient = ref(ALL)
const template = ref(ALL)
const hasFilters = computed(() => patient.value !== ALL || template.value !== ALL)

function clearFilters() {
  patient.value = ALL
  template.value = ALL
}

// Sem templateId (resposta antiga) o título faz as vezes de chave.
const templateKey = (a: Activity) => a.templateId ?? a.title

function uniqueOptions(pairs: [string, string][]) {
  const map = new Map(pairs)
  return [...map.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

const patientOptions = computed(() => [
  { value: ALL, label: 'Todos' },
  ...uniqueOptions(all.value.map(a => [a.patientId, a.patientName ?? 'Paciente'])),
])
const templateOptions = computed(() => [
  { value: ALL, label: 'Todos' },
  ...uniqueOptions(all.value.map(a => [templateKey(a), a.title])),
])

const tabs = computed(() => {
  const now = new Date()
  return ACTIVITY_QUEUE_TABS.map(t => ({
    ...t,
    items: all.value.filter(a => activityQueueTab(a, now) === t.value),
  }))
})

const rows = computed(() =>
  (tabs.value.find(t => t.value === tab.value)?.items ?? []).filter(a =>
    (patient.value === ALL || a.patientId === patient.value)
    && (template.value === ALL || templateKey(a) === template.value)),
)
const countText = computed(() => rows.value.length === 1 ? '1 atividade' : `${rows.value.length} atividades`)

const emptyText = computed(() => {
  if (hasFilters.value) return 'Nenhuma atividade com esses filtros.'
  if (!all.value.length) return 'Nenhuma atividade atribuída. Use "Atribuir atividade" para enviar a primeira.'
  return 'Nenhuma atividade nesta aba.'
})

const filterTriggerClass = 'h-10 w-auto gap-2.5 rounded-lg border-border bg-card px-3.5 text-foreground shadow-none hover:border-input-hover'
</script>

<template>
  <PageHeader eyebrow="Atividades" title="Fila de atividades">
    <template #actions>
      <AssignActivityDialog>
        <Button>
          <Plus />
          Atribuir atividade
        </Button>
      </AssignActivityDialog>
    </template>
  </PageHeader>

  <div class="flex flex-col gap-6 px-4 pb-14 pt-6 md:px-8 lg:px-12">
    <Tabs v-model="tab" class="animate-rise max-w-full self-start [animation-delay:60ms]">
      <TabsList aria-label="Situação">
        <TabsTrigger v-for="t in tabs" :key="t.value" :value="t.value" class="sm:w-[150px]">
          {{ t.label }} <span class="font-mono text-xs text-muted-foreground">{{ t.items.length }}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <div class="animate-rise flex flex-wrap items-center gap-2.5 [animation-delay:120ms]">
      <CustomDropdown
        v-model="patient"
        :options="patientOptions"
        search-placeholder="Buscar paciente"
        empty-text="Nenhuma paciente encontrada."
        aria-label="Filtrar por paciente"
        :class="filterTriggerClass"
        content-class="w-60"
      >
        <template #trigger="{ selected }">
          <span class="text-muted-foreground">Paciente</span>
          <span class="max-w-40 truncate">{{ selected?.label ?? 'Todos' }}</span>
          <ChevronDown class="size-4 shrink-0 text-muted-foreground" />
        </template>
      </CustomDropdown>
      <CustomDropdown
        v-model="template"
        :options="templateOptions"
        search-placeholder="Buscar template"
        empty-text="Nenhum template encontrado."
        aria-label="Filtrar por template"
        :class="filterTriggerClass"
        content-class="w-60"
      >
        <template #trigger="{ selected }">
          <span class="text-muted-foreground">Template</span>
          <span class="max-w-40 truncate">{{ selected?.label ?? 'Todos' }}</span>
          <ChevronDown class="size-4 shrink-0 text-muted-foreground" />
        </template>
      </CustomDropdown>
      <Button v-if="hasFilters" variant="ghost" class="animate-fade text-primary" @click="clearFilters">
        Limpar filtros
      </Button>
      <span class="ml-auto text-[13px] text-muted-foreground">{{ countText }}</span>
    </div>

    <Card role="region" aria-label="Lista de atividades" class="animate-rise overflow-hidden [animation-delay:180ms]">
      <div class="flex items-center gap-4 border-b border-border bg-surface-subtle px-4 py-3">
        <span class="label-mono tracking-[0.08em]">Paciente e atividade</span>
      </div>

      <div v-if="error" class="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <p class="text-[15px] text-muted-foreground">Não foi possível carregar as atividades. Verifique a conexão e tente de novo.</p>
        <Button variant="outline" size="sm" :loading="status === 'pending'" @click="refresh()">Tentar de novo</Button>
      </div>
      <div v-else-if="status === 'pending' && !activities" class="flex flex-col gap-3 p-4">
        <Skeleton v-for="n in 3" :key="n" class="h-12 w-full" />
      </div>
      <div v-else-if="rows.length" :key="`${tab}-${patient}-${template}`" class="animate-fade">
        <ActivityRow v-for="a in rows" :key="a.id" :activity="a" show-patient />
      </div>
      <EmptyState
        v-else
        compact
        class="animate-fade rounded-none border-0 py-10"
        :description="emptyText"
      >
        <template v-if="hasFilters" #action>
          <Button variant="outline" size="sm" @click="clearFilters">Limpar filtros</Button>
        </template>
      </EmptyState>
    </Card>
  </div>
</template>
