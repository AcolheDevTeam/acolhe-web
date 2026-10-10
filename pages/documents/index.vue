<script setup lang="ts">
import { ChevronDown, Download, Link2, Plus, Search, ShieldCheck } from 'lucide-vue-next'
import type { ClinicalDocument, ClinicalDocumentLink } from '~/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoiceChips } from '@/components/ui/choice-chips'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Documentos emitidos (protótipo "Documentos", ACO-100): todas as pacientes da
// psicóloga, com busca por código ou paciente, filtro de tipo e de paciente.
// Baixar e copiar pedem sempre um link novo de 24 horas.
definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const { data: documents, error, refresh } = await useDocuments()
const all = computed(() => documents.value ?? [])

const search = ref('')
const type = ref('')
const patientId = ref('')
const hasFilters = computed(() => !!search.value.trim() || !!type.value || !!patientId.value)
function clearFilters() {
  search.value = ''
  type.value = ''
  patientId.value = ''
}

const patientOptions = computed(() => {
  const names = new Map<string, string>()
  for (const doc of all.value) names.set(doc.patientId, doc.patientName)
  return [
    { value: '', label: 'Todas' },
    ...[...names].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
  ]
})

const rows = computed(() => filterDocuments(all.value, { search: search.value, type: type.value, patientId: patientId.value }))

// O link novo atualiza a validade na hora, sem esperar o próximo carregamento.
function onIssued(doc: Pick<ClinicalDocument, 'id'>, link: ClinicalDocumentLink) {
  documents.value = all.value.map(d => (d.id === doc.id ? { ...d, linkExpiresAt: link.expiresAt } : d))
}
const { busyId, download, copy } = useDocumentLinkActions(onIssued)

// Enquanto algum PDF estiver sendo gerado, a lista se atualiza sozinha.
const hasPending = computed(() => all.value.some(d => d.status === 'pending'))
let timer: ReturnType<typeof setTimeout> | undefined
function schedule() {
  if (timer) clearTimeout(timer)
  timer = hasPending.value ? setTimeout(async () => { await refresh(); schedule() }, 2000) : undefined
}
onMounted(schedule)
watch(hasPending, schedule)
onBeforeUnmount(() => timer && clearTimeout(timer))

// Relógio para a validade dos links (expira enquanto a página está aberta).
const now = ref(new Date())
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => { clock = setInterval(() => { now.value = new Date() }, 60_000) })
onBeforeUnmount(() => clock && clearInterval(clock))
const linkOf = (doc: ClinicalDocument) => documentLinkLabel(doc, now.value)

const panelOpen = ref(false)
const panelDoc = ref<ClinicalDocument | null>(null)
function openHash(doc: ClinicalDocument) {
  panelDoc.value = doc
  panelOpen.value = true
}

const listError = computed(() => (error.value ? apiErrorMessage(error.value, DOCUMENT_LIST_ERRORS) : ''))
</script>

<template>
  <PageHeader eyebrow="Documentos" title="Documentos emitidos">
    <template #actions>
      <Button as-child>
        <NuxtLink to="/documents/new">
          <Plus />
          Emitir documento
        </NuxtLink>
      </Button>
    </template>
  </PageHeader>

  <div class="flex flex-col gap-6 px-4 pb-14 pt-7 md:px-8 lg:px-12">
    <div class="animate-rise flex flex-wrap items-center gap-3 [animation-delay:80ms]">
      <div class="relative min-w-0 flex-[1_1_240px] sm:max-w-[360px]">
        <label for="busca-doc" class="sr-only">Buscar por código ou paciente</label>
        <Search class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id="busca-doc"
          v-model="search"
          placeholder="Buscar por código ou paciente"
          autocomplete="off"
          class="h-10 border-border pl-10 text-sm"
        />
      </div>
      <ChoiceChips v-model="type" :options="DOCUMENT_TYPE_FILTERS" label="Tipo de documento" />
      <CustomDropdown
        v-model="patientId"
        :options="patientOptions"
        search-placeholder="Buscar paciente"
        empty-text="Nenhuma paciente encontrada."
        aria-label="Filtrar por paciente"
        class="h-10 w-auto gap-2.5 rounded-lg border-border bg-card px-3.5 text-foreground shadow-none hover:border-input-hover"
        content-class="w-64"
      >
        <template #trigger="{ selected }">
          <span class="text-muted-foreground">Paciente</span>
          <span class="max-w-40 truncate font-medium">{{ selected?.label ?? 'Todas' }}</span>
          <ChevronDown class="size-4 shrink-0 text-muted-foreground" />
        </template>
      </CustomDropdown>
    </div>

    <p v-if="listError" role="alert" class="text-sm text-destructive">{{ listError }}</p>

    <Card role="region" aria-label="Lista de documentos" class="animate-rise overflow-hidden [animation-delay:120ms]">
      <!-- Celular: uma linha por documento, ações embaixo. -->
      <ul v-if="rows.length" class="flex flex-col divide-y md:hidden">
        <li v-for="doc in rows" :key="doc.id" class="flex flex-col gap-3 px-4 py-4">
          <div class="flex items-start justify-between gap-3">
            <span class="flex min-w-0 flex-col gap-0.5">
              <span class="truncate text-[15px] font-semibold">{{ doc.patientName }}</span>
              <span class="text-[13px] text-muted-foreground">{{ DOCUMENT_TYPE_SHORT[doc.type] ?? doc.type }} · {{ formatShortDate(doc.createdAt) }}</span>
            </span>
            <span class="shrink-0 font-mono text-[12px] text-secondary-foreground">{{ doc.code }}</span>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span
              class="rounded-full px-2.5 py-1 text-[12px] font-medium"
              :class="linkOf(doc).active ? 'bg-accent text-success' : 'bg-secondary text-muted-foreground'"
            >{{ linkOf(doc).text }}</span>
            <span class="flex items-center gap-1">
              <Button variant="ghost" size="icon" :aria-label="`Baixar ${doc.code}`" :disabled="doc.status !== 'ready' || busyId === doc.id" @click="download(doc)">
                <Download aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" :aria-label="`Copiar link de ${doc.code}`" :disabled="doc.status !== 'ready' || busyId === doc.id" @click="copy(doc)">
                <Link2 aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" :aria-label="`Ver hash de ${doc.code}`" :disabled="doc.status !== 'ready'" @click="openHash(doc)">
                <ShieldCheck aria-hidden="true" />
              </Button>
            </span>
          </div>
        </li>
      </ul>

      <Table v-if="rows.length" class="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Emitido em</TableHead>
            <TableHead>Link de download</TableHead>
            <TableHead class="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="doc in rows" :key="doc.id">
            <TableCell class="whitespace-nowrap font-mono text-[13px]">{{ doc.code }}</TableCell>
            <TableCell>{{ DOCUMENT_TYPE_SHORT[doc.type] ?? doc.type }}</TableCell>
            <TableCell class="font-medium">{{ doc.patientName }}</TableCell>
            <TableCell class="whitespace-nowrap text-secondary-foreground">{{ formatShortDate(doc.createdAt) }}</TableCell>
            <TableCell>
              <span
                class="whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium"
                :class="linkOf(doc).active ? 'bg-accent text-success' : 'bg-secondary text-muted-foreground'"
              >{{ linkOf(doc).text }}</span>
            </TableCell>
            <TableCell class="text-right">
              <span class="inline-flex items-center gap-1">
                <Button variant="ghost" size="icon" :aria-label="`Baixar ${doc.code}`" :title="`Baixar ${doc.code}`" :disabled="doc.status !== 'ready' || busyId === doc.id" @click="download(doc)">
                  <Download aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon" :aria-label="`Copiar link de ${doc.code}`" :title="'Copiar link (vale 24 horas)'" :disabled="doc.status !== 'ready' || busyId === doc.id" @click="copy(doc)">
                  <Link2 aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon" :aria-label="`Ver hash de ${doc.code}`" :title="'Ver hash de integridade'" :disabled="doc.status !== 'ready'" @click="openHash(doc)">
                  <ShieldCheck aria-hidden="true" />
                </Button>
              </span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <EmptyState
        v-if="!rows.length && hasFilters"
        compact
        class="animate-fade m-4"
        description="Nenhum documento encontrado com esses filtros."
      >
        <template #action>
          <Button variant="outline" @click="clearFilters">Limpar filtros</Button>
        </template>
      </EmptyState>
      <EmptyState
        v-else-if="!rows.length"
        class="animate-fade m-4"
        title="Nenhum documento emitido"
        description="Declarações de comparecimento e recibos que você emitir aparecem aqui, com o link de download."
      >
        <template #action>
          <Button variant="outline" as-child>
            <NuxtLink to="/documents/new">Emitir documento</NuxtLink>
          </Button>
        </template>
      </EmptyState>
    </Card>
  </div>

  <DocumentIntegritySheet v-model:open="panelOpen" :document="panelDoc" />
</template>
