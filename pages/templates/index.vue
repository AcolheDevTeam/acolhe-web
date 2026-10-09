<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next'
import type { TemplateScope } from '~/utils/activity-template'
import { Button } from '@/components/ui/button'
import { ChoiceChips } from '@/components/ui/choice-chips'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Biblioteca de templates (protótipo "Templates"): abas por escopo com contagem,
// busca, chips de tipo e cards. Só a versão mais recente de cada template
// aparece; arquivados não.
definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const { data: templates } = await useTemplates()
const all = computed(() => templates.value ?? [])

const search = ref('')
// '' = todos os tipos. O tipo base passou a filtrar a biblioteca em ACO-74;
// antes ele era só uma etiqueta no card.
const typeCode = ref('')
const hasFilters = computed(() => !!search.value.trim() || !!typeCode.value)

function clearFilters() {
  search.value = ''
  typeCode.value = ''
  tab.value = 'all'
}

const filtered = computed(() =>
  filterTemplates(all.value, { search: search.value, typeCode: typeCode.value }),
)

const tab = ref<'all' | TemplateScope>('all')
// "Da clínica" (templates de outras pessoas da organização) só aparece quando
// existe algum: para quem atende sozinha a aba ficaria sempre vazia.
const hasClinic = computed(() => all.value.some((t) => templateScope(t) === 'clinic'))
const tabs = computed(() => [
  { value: 'all' as const, label: 'Todos' },
  { value: 'mine' as const, label: 'Meus' },
  ...(hasClinic.value ? [{ value: 'clinic' as const, label: 'Da clínica' }] : []),
  { value: 'acolhe' as const, label: 'Biblioteca Acolhe' },
].map((t) => ({
  ...t,
  rows: t.value === 'all' ? filtered.value : filtered.value.filter((row) => templateScope(row) === t.value),
})))
const rows = computed(() => tabs.value.find((t) => t.value === tab.value)?.rows ?? [])
</script>

<template>
  <PageHeader eyebrow="Atividades" title="Templates" description="Modelos de atividade para enviar às pacientes. Editar um template cria uma nova versão.">
    <template #actions>
      <Button as-child>
        <NuxtLink to="/templates/new">
          <Plus />
          Novo template
        </NuxtLink>
      </Button>
    </template>
  </PageHeader>

  <div class="flex flex-col gap-7 px-4 pb-14 pt-7 md:px-8 lg:px-12">
    <Tabs v-model="tab" class="flex flex-col gap-7">
      <div class="flex flex-col gap-4">
        <div class="animate-rise flex flex-wrap items-center justify-between gap-4 [animation-delay:80ms]">
          <TabsList aria-label="Escopo" class="max-w-full">
            <TabsTrigger v-for="t in tabs" :key="t.value" :value="t.value" class="lg:min-w-[132px]">
              {{ t.label }} <span class="font-mono text-[11px] text-muted-foreground">{{ t.rows.length }}</span>
            </TabsTrigger>
          </TabsList>

          <div class="relative min-w-0 flex-[0_1_320px] max-sm:flex-auto">
            <label for="busca-template" class="sr-only">Buscar template</label>
            <Search class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="busca-template"
              v-model="search"
              placeholder="Buscar pelo nome"
              autocomplete="off"
              class="h-10 border-border pl-10 text-sm"
            />
          </div>
        </div>

        <div class="animate-rise flex flex-wrap items-center gap-2 [animation-delay:120ms]">
          <span class="mr-1 text-[13px] text-muted-foreground">Tipo</span>
          <ChoiceChips v-model="typeCode" :options="TEMPLATE_TYPE_FILTER_OPTIONS" label="Filtrar por tipo" />
        </div>
      </div>

      <TabsContent :value="tab" class="mt-0">
        <div v-if="rows.length" class="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-5">
          <!-- A entrada fica no invólucro: a animação presa no fim anularia o
               deslocamento do hover do card. -->
          <div
            v-for="(template, i) in rows"
            :key="template.id"
            class="animate-fade flex"
            :style="{ animationDelay: `${Math.min(i, 10) * 40}ms` }"
          >
            <TemplateCard :template="template" class="flex-1" />
          </div>
        </div>
        <EmptyState
          v-else-if="hasFilters"
          class="animate-fade"
          title="Nenhum template encontrado"
          description="Mude o filtro ou crie um template novo."
        >
          <template #action>
            <Button variant="outline" @click="clearFilters">Limpar filtros</Button>
          </template>
        </EmptyState>
        <EmptyState
          v-else-if="tab === 'acolhe'"
          class="animate-fade"
          title="Biblioteca vazia"
          description="A biblioteca da Acolhe ainda não tem templates."
        />
        <EmptyState
          v-else
          class="animate-fade"
          title="Nenhum template ainda"
          description="Crie o primeiro em “Novo template” para poder atribuir atividades às pacientes."
        >
          <template #action>
            <Button variant="outline" as-child>
              <NuxtLink to="/templates/new">Novo template</NuxtLink>
            </Button>
          </template>
        </EmptyState>
      </TabsContent>
    </Tabs>
  </div>
</template>
