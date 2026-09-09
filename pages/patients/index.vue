<script setup lang="ts">
import { ChevronRight, ListFilter, Plus, Search } from 'lucide-vue-next'
import type { Patient } from '~/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const { data: patients } = await useFetch<Patient[]>('/api/patients', {
  key: 'patients-list',
  default: () => [],
})

const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = patients.value ?? []
  return q ? list.filter((p) => p.fullName.toLowerCase().includes(q)) : list
})

const byStatus = (status: string) => computed(() => filtered.value.filter((p) => p.status === status))
const active = byStatus('active')
const onboarding = byStatus('onboarding')
const archived = byStatus('archived')

const tabs = computed(() => [
  { value: 'active', label: 'Ativos', rows: active.value },
  { value: 'onboarding', label: 'Em onboarding', rows: onboarding.value },
  { value: 'archived', label: 'Arquivados', rows: archived.value },
])

function open(id: string) {
  navigateTo(`/patients/${id}`)
}
</script>

<template>
  <PageHeader title="Pacientes">
    <template #actions>
      <div class="relative hidden w-56 lg:block">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="search" placeholder="Buscar…" class="pl-9" />
      </div>
      <Button variant="outline" size="sm">
        <ListFilter />
        Filtros
      </Button>
      <NewPatientDialog>
        <Button size="sm">
          <Plus />
          Novo paciente
        </Button>
      </NewPatientDialog>
    </template>
  </PageHeader>

  <div class="px-4 py-6 md:px-8 md:py-8">
    <Tabs default-value="active">
      <TabsList>
        <TabsTrigger v-for="t in tabs" :key="t.value" :value="t.value">
          {{ t.label }} · {{ t.rows.length }}
        </TabsTrigger>
      </TabsList>

      <TabsContent v-for="t in tabs" :key="t.value" :value="t.value" class="mt-6">
        <div class="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead class="label-mono">Paciente</TableHead>
                <TableHead class="label-mono">Abordagem</TableHead>
                <TableHead class="label-mono">Sessões</TableHead>
                <TableHead class="label-mono">Adesão</TableHead>
                <TableHead class="label-mono">Última</TableHead>
                <TableHead class="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="p in t.rows"
                :key="p.id"
                class="cursor-pointer"
                @click="open(p.id)"
              >
                <TableCell>
                  <div class="flex items-center gap-3">
                    <Avatar class="size-9">
                      <AvatarFallback class="bg-secondary text-xs">{{ initials(p.fullName) }}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p class="font-medium">{{ p.fullName }}</p>
                      <p v-if="p.age" class="text-xs text-muted-foreground">{{ p.age }} anos</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  <template v-if="p.approach">
                    {{ p.approach }}<template v-if="p.approachSince"> · {{ p.approachSince }}</template>
                  </template>
                  <template v-else>—</template>
                </TableCell>
                <TableCell class="tabular-nums">{{ p.sessionsCount ?? '—' }}</TableCell>
                <TableCell>
                  <AdherenceBar :value="p.adherence" />
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">{{ p.lastActivityLabel ?? '—' }}</TableCell>
                <TableCell>
                  <ChevronRight class="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
              <TableRow v-if="!t.rows.length" class="hover:bg-transparent">
                <TableCell colspan="6" class="py-12 text-center text-sm text-muted-foreground">
                  Nenhum paciente aqui.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
