<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Biblioteca de templates (tela 11 do design): busca, filtros por origem e
// cards. Só a versão mais recente de cada template aparece; arquivados não.
definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const { data: templates } = await useTemplates()

const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = templates.value ?? []
  return q
    ? list.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
    : list
})

const tabs = computed(() => [
  { value: 'all', label: 'Todos', rows: filtered.value },
  { value: 'mine', label: 'Meus', rows: filtered.value.filter((t) => t.ownedByMe) },
  { value: 'acolhe', label: 'Biblioteca Acolhe', rows: filtered.value.filter((t) => t.isGlobal) },
])
</script>

<template>
  <PageHeader title="Templates">
    <template #actions>
      <div class="relative hidden w-56 lg:block">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="search" placeholder="Buscar…" class="pl-9" />
      </div>
      <Button size="sm" as-child>
        <NuxtLink to="/templates/new">
          <Plus />
          <span class="hidden sm:inline">Novo template</span>
          <span class="sr-only sm:hidden">Novo template</span>
        </NuxtLink>
      </Button>
    </template>
  </PageHeader>

  <div class="flex flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
    <div class="relative lg:hidden">
      <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="search" placeholder="Buscar template…" class="pl-9" />
    </div>

    <Tabs default-value="all">
      <TabsList>
        <TabsTrigger v-for="t in tabs" :key="t.value" :value="t.value">
          {{ t.label }} · {{ t.rows.length }}
        </TabsTrigger>
      </TabsList>

      <TabsContent v-for="t in tabs" :key="t.value" :value="t.value" class="mt-6">
        <div v-if="t.rows.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <TemplateCard v-for="template in t.rows" :key="template.id" :template="template" />
        </div>
        <div
          v-else
          class="flex flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-16 text-center text-sm text-muted-foreground"
        >
          <p v-if="search">Nenhum template corresponde à busca.</p>
          <template v-else-if="t.value === 'acolhe'">
            <p>A biblioteca da Acolhe ainda não tem templates.</p>
          </template>
          <template v-else>
            <p>Nenhum template ainda.</p>
            <p>Crie o primeiro em "Novo template" para poder atribuir atividades às pacientes.</p>
          </template>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
