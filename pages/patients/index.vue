<script setup lang="ts">
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-vue-next'
import type { Patient } from '~/types'
import type { PatientSort, PatientSortKey } from '~/utils/patient-list'
import { ALL_APPROACHES, approachesOf, filterPatients, patientListMeta, sortPatients } from '~/utils/patient-list'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSortableHead,
} from '@/components/ui/table'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const { data: patients } = await useFetch<Patient[]>('/api/patients', {
  key: 'patients-list',
  default: () => [],
})

const all = computed(() => patients.value ?? [])

// A listagem ainda não traz os campos clínicos (abordagem, sessões, adesão,
// último contato): cada coluna e o filtro de abordagem só aparecem quando
// algum paciente tiver o dado.
const columns = computed(() => ({
  approach: all.value.some(p => p.approach),
  sessions: all.value.some(p => p.sessionsCount != null),
  adherence: all.value.some(p => p.adherence != null),
  last: all.value.some(p => p.lastActivityLabel),
}))

const search = ref('')
const approach = ref(ALL_APPROACHES)
const approaches = computed(() => approachesOf(all.value))
const approachOptions = computed(() => [
  { value: ALL_APPROACHES, label: 'Todas' },
  ...approaches.value.map(a => ({ value: a, label: a })),
])
const hasFilters = computed(() => !!search.value.trim() || approach.value !== ALL_APPROACHES)

function clearFilters() {
  search.value = ''
  approach.value = ALL_APPROACHES
}

const sort = ref<PatientSort>({ key: 'name', dir: 'asc' })
function sortBy(key: PatientSortKey) {
  sort.value = sort.value.key === key
    ? { key, dir: sort.value.dir === 'asc' ? 'desc' : 'asc' }
    : { key, dir: key === 'name' ? 'asc' : 'desc' }
}
const dirOf = (key: PatientSortKey) => (sort.value.key === key ? sort.value.dir : null)

const visible = computed(() => sortPatients(filterPatients(all.value, search.value, approach.value), sort.value))

const tab = ref('active')
const tabs = computed(() => [
  { value: 'active', label: 'Ativos' },
  { value: 'onboarding', label: 'Em onboarding' },
  { value: 'archived', label: 'Arquivados' },
].map(t => ({ ...t, rows: visible.value.filter(p => p.status === t.value) })))
const rows = computed(() => tabs.value.find(t => t.value === tab.value)?.rows ?? [])

function open(id: string) {
  navigateTo(`/patients/${id}`)
}
</script>

<template>
  <PageHeader eyebrow="Pacientes" title="Seus pacientes">
    <template #actions>
      <NewPatientDialog>
        <Button>
          <Plus />
          Novo paciente
        </Button>
      </NewPatientDialog>
    </template>
  </PageHeader>

  <div class="flex flex-col gap-6 px-4 pb-14 pt-6 md:px-8 lg:px-12">
    <Tabs v-model="tab" class="flex flex-col gap-6">
      <div class="animate-rise flex flex-wrap items-center gap-3 [animation-delay:60ms]">
        <TabsList aria-label="Situação do vínculo">
          <TabsTrigger v-for="t in tabs" :key="t.value" :value="t.value" class="sm:w-[150px]">
            {{ t.label }} <span class="font-mono text-xs text-muted-foreground">{{ t.rows.length }}</span>
          </TabsTrigger>
        </TabsList>

        <div class="relative min-w-0 flex-[1_1_240px] sm:max-w-[360px]">
          <label for="busca-paciente" class="sr-only">Buscar paciente</label>
          <Search class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="busca-paciente"
            v-model="search"
            placeholder="Buscar por nome"
            autocomplete="off"
            class="h-10 border-border pl-10 text-sm"
          />
        </div>

        <CustomDropdown
          v-if="approaches.length"
          v-model="approach"
          :options="approachOptions"
          search-placeholder="Buscar abordagem"
          empty-text="Nenhuma abordagem encontrada."
          aria-label="Filtrar por abordagem"
          class="h-10 w-auto gap-2.5 rounded-lg border-border bg-card px-3.5 text-foreground shadow-none hover:border-input-hover"
          content-class="w-60"
        >
          <template #trigger="{ selected }">
            <span class="text-muted-foreground">Abordagem</span>
            <span class="font-medium">{{ selected?.label ?? 'Todas' }}</span>
            <ChevronDown class="size-4 shrink-0 text-muted-foreground" />
          </template>
        </CustomDropdown>
      </div>

      <TabsContent :value="tab" class="mt-0">
        <Card role="region" aria-label="Lista de pacientes" class="animate-rise overflow-hidden [animation-delay:120ms]">
          <!-- Celular: lista de linhas (.row do protótipo). -->
          <ul v-if="rows.length" class="flex flex-col p-2 md:hidden">
            <li v-for="p in rows" :key="p.id">
              <NuxtLink
                :to="`/patients/${p.id}`"
                class="flex items-center gap-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                <Avatar :tone="p.relationshipStatus === 'pending' ? 'pending' : 'soft'" class="size-9" aria-hidden="true">
                  <AvatarFallback>{{ initials(p.fullName) }}</AvatarFallback>
                </Avatar>
                <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span class="truncate text-[15px] font-semibold">{{ p.fullName }}</span>
                  <span class="truncate text-[13px] text-muted-foreground">{{ patientListMeta(p) }}</span>
                </span>
                <span v-if="p.lastActivityLabel" class="shrink-0 text-[13px] text-secondary-foreground">{{ p.lastActivityLabel }}</span>
                <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>

          <Table class="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableSortableHead :direction="dirOf('name')" @sort="sortBy('name')">Paciente</TableSortableHead>
                <TableHead v-if="columns.approach">Abordagem</TableHead>
                <TableSortableHead v-if="columns.sessions" :direction="dirOf('sessions')" @sort="sortBy('sessions')">Sessões</TableSortableHead>
                <TableSortableHead v-if="columns.adherence" :direction="dirOf('adherence')" @sort="sortBy('adherence')">Adesão</TableSortableHead>
                <TableHead v-if="columns.last">Último contato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="p in rows"
                :key="p.id"
                class="animate-fade cursor-pointer"
                @click="open(p.id)"
              >
                <TableCell>
                  <NuxtLink
                    :to="`/patients/${p.id}`"
                    class="-m-1 flex w-fit items-center gap-3 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                    @click.stop
                  >
                    <Avatar :tone="p.relationshipStatus === 'pending' ? 'pending' : 'soft'" class="size-9" aria-hidden="true">
                      <AvatarFallback>{{ initials(p.fullName) }}</AvatarFallback>
                    </Avatar>
                    <span class="flex flex-col gap-0.5">
                      <span class="text-[15px] font-semibold">{{ p.fullName }}</span>
                      <span class="text-[13px] text-muted-foreground">{{ patientListMeta(p) }}</span>
                    </span>
                  </NuxtLink>
                </TableCell>
                <TableCell v-if="columns.approach" class="text-secondary-foreground">{{ p.approach ?? '—' }}</TableCell>
                <TableCell v-if="columns.sessions" class="font-mono">{{ p.sessionsCount ?? '—' }}</TableCell>
                <TableCell v-if="columns.adherence">
                  <AdherenceBar :value="p.adherence" />
                </TableCell>
                <TableCell v-if="columns.last" class="text-secondary-foreground">{{ p.lastActivityLabel ?? '—' }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <EmptyState
            v-if="!rows.length"
            compact
            class="animate-fade rounded-none border-0"
            :description="hasFilters ? 'Nenhum paciente encontrado com esses filtros.' : 'Nenhum paciente nesta lista.'"
          >
            <template v-if="hasFilters" #action>
              <Button variant="outline" size="sm" @click="clearFilters">Limpar filtros</Button>
            </template>
          </EmptyState>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
