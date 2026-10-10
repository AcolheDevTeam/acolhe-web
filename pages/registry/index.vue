<script setup lang="ts">
import { ChevronRight, FileLock2, Plus } from 'lucide-vue-next'
import type { Patient } from '~/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoiceChips } from '@/components/ui/choice-chips'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { documentaryCategories, type DocumentaryCategory } from '~/schemas/documentary'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

// A API guarda um caderno por paciente e tipo (não entradas soltas com título,
// como no protótipo). A lista mostra as pacientes que já têm caderno; o tipo
// se escolhe dentro do caderno. A lista não traz o tipo de cada caderno, então
// não há filtro por tipo aqui (seria uma requisição por paciente).
const page = ref(1)
const { data, error, status, refresh } = useDocumentaryPatients(page)

// "Abrir caderno": qualquer paciente com vínculo ativo, inclusive sem caderno.
const { data: patients, error: patientsError, refresh: refreshPatients } = await useFetch<Patient[]>('/api/patients', {
  key: 'patients-list',
  default: () => [],
})
const patientOptions = computed(() =>
  (patients.value ?? [])
    .filter(p => p.status === 'active' && p.relationshipStatus === 'active')
    .map(p => ({ value: p.id, label: p.fullName })),
)
const categoryOptions = documentaryCategories.map(c => ({ ...c }))
const category = ref<DocumentaryCategory>('hypothesis')
const patientId = ref('')

function openNotebook() {
  if (!patientId.value) return
  navigateTo({ path: `/registry/${patientId.value}`, query: { categoria: category.value } })
}

function focusForm() {
  const trigger = document.getElementById('rd-paciente')
  trigger?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  trigger?.focus({ preventScroll: true })
}
</script>
<template>
  <PageHeader eyebrow="Só você" title="Registro Documental">
    <template #actions>
      <Button @click="focusForm">
        <Plus />
        Abrir caderno
      </Button>
    </template>
  </PageHeader>
  <div class="flex flex-col gap-6 px-4 pb-14 pt-6 md:px-8 lg:px-12">
    <div class="flex animate-rise items-start gap-3 rounded-xl bg-brand px-4 py-3.5 text-sm leading-[1.55] text-brand-foreground [animation-delay:50ms]">
      <FileLock2 class="mt-0.5 size-4 shrink-0 text-highlight" aria-hidden="true" />
      <p>
        Só você vê estas anotações. Elas não são compartilhadas com pacientes
        nem com outras profissionais e não entram na exportação de dados da
        paciente.
      </p>
    </div>

    <DocumentaryDepartures />

    <div class="flex flex-wrap items-start gap-6">
      <section aria-labelledby="rd-cadernos" class="flex min-w-0 flex-[3_1_420px] animate-rise flex-col gap-2.5 [animation-delay:100ms]">
        <h2 id="rd-cadernos" class="label-mono">Cadernos por paciente</h2>
        <div v-if="error" role="alert" class="space-y-3">
          <p class="text-sm text-destructive">
            {{ documentaryErrorText(error) }}
          </p>
          <Button variant="outline" @click="refresh()">Tentar novamente</Button>
        </div>
        <p v-else-if="status === 'pending'" class="text-sm text-muted-foreground">
          Carregando cadernos…
        </p>
        <template v-else-if="data">
          <EmptyState v-if="!data.items.length" compact>
            {{ data.totalCount ? 'Nenhum caderno salvo nesta página.' : 'Você ainda não tem cadernos. Para começar, escolha o(a) paciente e o tipo em Abrir caderno.' }}
          </EmptyState>
          <ul v-else class="flex flex-col gap-2.5">
            <li v-for="patient in data.items" :key="patient.id">
              <NuxtLink
                :to="`/registry/${patient.id}`"
                class="flex animate-fade items-center gap-3 rounded-[14px] border bg-card px-[18px] py-4 transition-[border-color,transform] duration-200 ease-out hover:-translate-y-px hover:border-input-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                <span class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span class="min-w-0 truncate text-[15px] font-semibold">{{ patient.fullName }}</span>
                  <Badge v-if="!patient.writable" variant="neutral">Somente leitura</Badge>
                </span>
                <span class="shrink-0 text-[13px] text-muted-foreground">Abrir cadernos</span>
                <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
          <PaginationControls
            :page="data.page"
            :total-pages="data.totalPages"
            :total-count="data.totalCount"
            @change="page = $event"
          />
        </template>
      </section>

      <Card
        role="region"
        aria-labelledby="rd-abrir"
        class="flex min-w-0 flex-[2_1_340px] animate-rise flex-col gap-4 p-6 [animation-delay:150ms]"
      >
        <h2 id="rd-abrir" class="text-lg font-semibold">Abrir caderno</h2>
        <p class="text-sm leading-relaxed text-muted-foreground">
          Cada paciente tem um caderno por tipo. Se ele já existir, abre com o
          texto salvo.
        </p>
        <div class="flex flex-col gap-2">
          <span class="text-sm font-medium" aria-hidden="true">Tipo</span>
          <ChoiceChips v-model="category" :options="categoryOptions" label="Tipo" />
        </div>
        <div class="flex flex-col gap-2">
          <label for="rd-paciente" class="text-sm font-medium">Paciente</label>
          <CustomDropdown
            id="rd-paciente"
            v-model="patientId"
            :options="patientOptions"
            placeholder="Escolha o(a) paciente"
            search-placeholder="Buscar paciente"
            empty-text="Nenhum(a) paciente encontrado(a)."
            class="h-11 rounded-lg bg-card px-3.5 text-sm shadow-none hover:border-input-hover"
          />
          <div v-if="patientsError" role="alert" class="flex flex-wrap items-center gap-3 text-sm">
            <p class="text-destructive">Não foi possível carregar os pacientes agora.</p>
            <Button variant="outline" size="sm" @click="refreshPatients()">Tentar novamente</Button>
          </div>
        </div>
        <Button class="self-start" :disabled="!patientId" @click="openNotebook">Abrir caderno</Button>
      </Card>
    </div>
  </div>
</template>
