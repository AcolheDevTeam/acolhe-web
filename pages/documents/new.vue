<script setup lang="ts">
import { Check, Copy, Download, FileText, Loader2 } from 'lucide-vue-next'
import type { ClinicalDocument, Patient, Session, User } from '~/types'
import { generateDocumentSchema, type DocumentType } from '~/schemas/document'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioCardGroup } from '@/components/ui/radio-card-group'

// Emitir documento (protótipo "Declaracao", ACO-100): declaração de
// comparecimento ou recibo. A API grava o pedido e o worker gera o PDF; a tela
// acompanha até ficar pronto e então oferece baixar ou copiar o link (24 h).
// O atestado psicológico fica fora até o modelo ser validado (CFP 06/2019).
definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const { data: me } = useNuxtData<User | null>('me')
const route = useRoute()

const { data: patients } = await useFetch<Patient[]>('/api/patients', {
  key: 'patients-list',
  default: () => [],
})
const patientOptions = computed(() =>
  (patients.value ?? [])
    .filter(p => p.status === 'active' && p.relationshipStatus === 'active')
    .map(p => ({ value: p.id, label: p.fullName })),
)

// Os já emitidos servem para sugerir a cidade usada da última vez.
const { data: issued } = await useDocuments()

const type = ref<DocumentType>('declaration')
const initialPatient = typeof route.query.patientId === 'string' ? route.query.patientId : ''
const patientId = ref(patientOptions.value.some(o => o.value === initialPatient) ? initialPatient : '')
const patientName = computed(() => patientOptions.value.find(o => o.value === patientId.value)?.label ?? '')
const selected = ref<string[]>([])
const purpose = ref('')
const amount = ref('')
const payerName = ref('')
const payerCpf = ref('')
const city = ref(issued.value?.find(d => d.city)?.city ?? '')
const errors = ref<Record<string, string>>({})

// Sessões da paciente escolhida (só as que já aconteceram). Chave por paciente
// para não cruzar cache entre pacientes (LGPD).
const requestFetch = useRequestFetch()
const { data: sessions, pending: sessionsPending, error: sessionsError } = await useAsyncData<Session[]>(
  () => `document-sessions-${patientId.value || 'none'}`,
  () => (patientId.value ? requestFetch<Session[]>('/api/sessions', { query: { patientId: patientId.value } }) : Promise.resolve([])),
  { default: () => [], watch: [patientId] },
)
const pastSessions = computed(() => {
  const now = Date.now()
  return (sessions.value ?? [])
    .filter(s => new Date(s.occurredAt).getTime() <= now)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
})
watch(patientId, () => {
  selected.value = []
  errors.value = {}
})
// A mais recente já vem marcada: é o caso mais comum (declaração do dia).
watch(pastSessions, (list) => {
  if (!selected.value.length && list[0]) selected.value = [list[0].id]
}, { immediate: true })

function toggleSession(id: string, on: boolean) {
  selected.value = on ? [...new Set([...selected.value, id])] : selected.value.filter(s => s !== id)
}
const allSelected = computed(() => pastSessions.value.length > 0 && pastSessions.value.every(s => selected.value.includes(s.id)))
function toggleAll() {
  selected.value = allSelected.value ? [] : pastSessions.value.slice(0, 60).map(s => s.id)
}
const selectedDates = computed(() =>
  pastSessions.value.filter(s => selected.value.includes(s.id)).map(s => s.occurredAt),
)

function onAmountInput(value: string | number) {
  amount.value = maskBrl(String(value))
}
function onCpfInput(value: string | number) {
  payerCpf.value = maskCpf(String(value))
}

const preview = computed(() => documentPreview({
  type: type.value,
  patientName: patientName.value,
  sessionDates: selectedDates.value,
  city: city.value,
  purpose: purpose.value,
  amountCents: brlToCents(amount.value),
  payerName: payerName.value,
  payerCpf: payerCpf.value,
}))

// ----- Emissão e acompanhamento -----
const submitting = ref(false)
const submitError = ref('')
const progress = useDocumentProgress()
const doc = computed<ClinicalDocument | null>(() => progress.document.value)
const phase = computed(() => {
  if (submitting.value) return 'submitting'
  if (!doc.value) return 'idle'
  if (doc.value.status === 'ready') return 'ready'
  if (doc.value.status === 'failed') return 'failed'
  return progress.timedOut.value ? 'slow' : 'pending'
})
const locked = computed(() => phase.value !== 'idle' && phase.value !== 'failed')

async function submit() {
  submitError.value = ''
  const parsed = generateDocumentSchema.safeParse({
    patientId: patientId.value || undefined,
    type: type.value,
    sessionIds: selected.value,
    city: city.value,
    purpose: purpose.value,
    amountCents: brlToCents(amount.value),
    payerName: payerName.value,
    payerCpf: payerCpf.value,
  })
  if (!parsed.success) {
    const next: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      next[key] ??= issue.message
    }
    errors.value = next
    return
  }
  errors.value = {}
  submitting.value = true
  try {
    const created = await $fetch<ClinicalDocument>('/api/documents/generate', { method: 'POST', body: parsed.data })
    progress.track(created)
    void refreshNuxtData('documents-all')
  }
  catch (err) {
    submitError.value = generateDocumentErrorMessage(err)
  }
  finally {
    submitting.value = false
  }
}

function issueAnother() {
  progress.reset()
  submitError.value = ''
  selected.value = pastSessions.value[0] ? [pastSessions.value[0].id] : []
  purpose.value = ''
  amount.value = ''
  payerName.value = ''
  payerCpf.value = ''
}

const linkActions = useDocumentLinkActions()
const copied = ref(false)
async function copyLink() {
  if (!doc.value) return
  await linkActions.copy(doc.value)
  copied.value = true
}

// Igual ao cabeçalho do PDF: só o CRP, sem flexão de gênero.
const crpLine = computed(() => (me.value?.crp ? `CRP ${me.value.crp}` : ''))
</script>

<template>
  <PageHeader eyebrow="Documentos" title="Emitir documento">
    <template #actions>
      <Button variant="outline" as-child>
        <NuxtLink to="/documents">Documentos emitidos</NuxtLink>
      </Button>
    </template>
  </PageHeader>

  <div class="grid items-start gap-6 px-4 pb-14 pt-7 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-12">
    <Card class="animate-rise flex flex-col gap-6 p-5 [animation-delay:80ms] sm:p-7" role="region" aria-label="Dados do documento">
      <fieldset class="flex flex-col gap-3">
        <legend class="mb-3 text-sm font-medium">Tipo de documento</legend>
        <RadioCardGroup v-model="type" :options="DOCUMENT_TYPE_OPTIONS" label="Tipo de documento" :disabled="locked" />
      </fieldset>

      <div class="flex flex-col gap-2">
        <Label for="doc-paciente">Paciente</Label>
        <CustomDropdown
          id="doc-paciente"
          v-model="patientId"
          :options="patientOptions"
          placeholder="Selecione a paciente"
          search-placeholder="Buscar paciente…"
          empty-text="Nenhuma paciente com vínculo ativo encontrada."
          :disabled="locked"
          :aria-invalid="!!errors.patientId || undefined"
          class="h-11 rounded-lg border-input bg-card px-3.5 text-[15px] shadow-none hover:border-input-hover"
        />
        <p v-if="errors.patientId" class="text-[0.8rem] font-medium text-destructive">{{ errors.patientId }}</p>
      </div>

      <fieldset v-if="patientId" class="animate-fade flex flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <legend class="text-sm font-medium">Sessões incluídas</legend>
          <Button
            v-if="pastSessions.length > 1"
            type="button"
            variant="link"
            size="xs"
            class="h-auto px-0"
            :disabled="locked"
            @click="toggleAll"
          >
            {{ allSelected ? 'Limpar seleção' : 'Selecionar todas' }}
          </Button>
        </div>
        <p v-if="sessionsPending" class="text-sm text-muted-foreground">Carregando sessões…</p>
        <p v-else-if="sessionsError" class="text-sm text-destructive">
          {{ apiErrorMessage(sessionsError, { default: 'Não foi possível carregar as sessões desta paciente. Recarregue a página.' }) }}
        </p>
        <p v-else-if="!pastSessions.length" class="rounded-xl border border-dashed border-input-hover px-4 py-5 text-center text-sm text-muted-foreground">
          Esta paciente ainda não tem sessões registradas. Registre a sessão antes de emitir o documento.
        </p>
        <ul v-else class="flex max-h-72 flex-col overflow-y-auto rounded-xl border p-1">
          <li v-for="s in pastSessions" :key="s.id">
            <label
              :for="`sessao-${s.id}`"
              class="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-background"
            >
              <Checkbox
                :id="`sessao-${s.id}`"
                :model-value="selected.includes(s.id)"
                :disabled="locked"
                @update:model-value="(on) => toggleSession(s.id, on === true)"
              />
              <span class="flex-1">{{ sessionChoiceLabel(s.occurredAt).date }}</span>
              <span class="font-mono text-[13px] text-muted-foreground">{{ sessionChoiceLabel(s.occurredAt).hour }}</span>
            </label>
          </li>
        </ul>
        <p v-if="errors.sessionIds" class="text-[0.8rem] font-medium text-destructive">{{ errors.sessionIds }}</p>
      </fieldset>

      <div v-if="type === 'declaration'" class="flex flex-col gap-2">
        <Label for="doc-finalidade">Finalidade <span class="font-normal text-muted-foreground">(opcional)</span></Label>
        <Input
          id="doc-finalidade"
          v-model="purpose"
          maxlength="200"
          placeholder="Ex.: apresentação ao empregador"
          :disabled="locked"
          :aria-invalid="!!errors.purpose || undefined"
        />
        <p v-if="errors.purpose" class="text-[0.8rem] font-medium text-destructive">{{ errors.purpose }}</p>
      </div>

      <template v-else>
        <div class="flex flex-col gap-2">
          <Label for="doc-valor">Valor recebido</Label>
          <div class="relative">
            <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground" aria-hidden="true">R$</span>
            <Input
              id="doc-valor"
              :model-value="amount"
              inputmode="numeric"
              autocomplete="off"
              placeholder="0,00"
              class="pl-10"
              :disabled="locked"
              :aria-invalid="!!errors.amountCents || undefined"
              @update:model-value="onAmountInput"
            />
          </div>
          <p v-if="errors.amountCents" class="text-[0.8rem] font-medium text-destructive">{{ errors.amountCents }}</p>
        </div>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <Label for="doc-pagador">Quem pagou <span class="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input
              id="doc-pagador"
              v-model="payerName"
              maxlength="120"
              :placeholder="patientName || 'Nome de quem pagou'"
              :disabled="locked"
              :aria-invalid="!!errors.payerName || undefined"
            />
            <p v-if="errors.payerName" class="text-[0.8rem] font-medium text-destructive">{{ errors.payerName }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="doc-cpf">CPF de quem pagou <span class="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input
              id="doc-cpf"
              :model-value="payerCpf"
              inputmode="numeric"
              autocomplete="off"
              placeholder="000.000.000-00"
              :disabled="locked"
              :aria-invalid="!!errors.payerCpf || undefined"
              @update:model-value="onCpfInput"
            />
            <p v-if="errors.payerCpf" class="text-[0.8rem] font-medium text-destructive">{{ errors.payerCpf }}</p>
          </div>
        </div>
      </template>

      <div class="flex flex-col gap-2">
        <Label for="doc-cidade">Cidade</Label>
        <Input
          id="doc-cidade"
          v-model="city"
          maxlength="80"
          placeholder="Ex.: São Paulo"
          :disabled="locked"
          :aria-invalid="!!errors.city || undefined"
        />
        <p v-if="errors.city" class="text-[0.8rem] font-medium text-destructive">{{ errors.city }}</p>
      </div>

      <div aria-live="polite" class="flex flex-col gap-3 border-t pt-5">
        <template v-if="phase === 'idle' || phase === 'submitting'">
          <p v-if="submitError" role="alert" class="text-sm text-destructive">{{ submitError }}</p>
          <Button class="self-start" size="lg" :disabled="phase === 'submitting'" @click="submit">
            <Loader2 v-if="phase === 'submitting'" class="animate-spin" aria-hidden="true" />
            {{ phase === 'submitting' ? 'Enviando…' : 'Gerar PDF' }}
          </Button>
        </template>

        <InlineNotice v-else-if="phase === 'pending'" tone="neutral" class="flex items-center gap-2.5">
          <Loader2 class="size-4 shrink-0 animate-spin" aria-hidden="true" />
          Gerando o PDF…
        </InlineNotice>

        <template v-else-if="phase === 'slow'">
          <InlineNotice tone="warning">
            A geração está demorando. O documento aparece em Documentos emitidos quando ficar pronto.
          </InlineNotice>
          <Button variant="outline" class="self-start" as-child>
            <NuxtLink to="/documents">Ir para Documentos emitidos</NuxtLink>
          </Button>
        </template>

        <template v-else-if="phase === 'ready' && doc">
          <div class="flex flex-col gap-1">
            <p class="flex items-center gap-2 text-[15px] font-semibold">
              <Check class="size-4 text-primary" aria-hidden="true" />
              PDF gerado · <span class="font-mono text-sm">{{ doc.code }}</span>
            </p>
            <p class="text-sm text-muted-foreground">O link de download vale por 24 horas.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button :disabled="linkActions.busyId.value === doc.id" @click="linkActions.download(doc)">
              <Download aria-hidden="true" />
              Baixar PDF
            </Button>
            <Button variant="outline" :disabled="linkActions.busyId.value === doc.id" @click="copyLink">
              <Check v-if="copied" aria-hidden="true" />
              <Copy v-else aria-hidden="true" />
              {{ copied ? 'Link copiado' : 'Copiar link' }}
            </Button>
            <Button variant="ghost" @click="issueAnother(); copied = false">Emitir outro</Button>
          </div>
        </template>

        <template v-else-if="phase === 'failed'">
          <InlineNotice tone="danger">
            Não foi possível gerar o PDF deste documento. Confira os dados e tente de novo. Se continuar, avise o suporte com o código {{ doc?.code }}.
          </InlineNotice>
          <Button class="self-start" @click="submit">Tentar de novo</Button>
        </template>
      </div>
    </Card>

    <section aria-label="Pré-visualização" class="animate-rise flex flex-col gap-3 [animation-delay:120ms] lg:sticky lg:top-6">
      <p class="label-mono text-xs">Pré-visualização</p>
      <article class="flex flex-col gap-5 rounded-2xl border bg-card px-6 py-7 text-[15px] leading-relaxed text-foreground shadow-[0_1px_2px_rgba(22,26,58,.04),0_12px_32px_rgba(22,26,58,.06)] sm:px-10 sm:py-10">
        <header class="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
          <span class="flex flex-col gap-0.5">
            <span class="font-semibold">{{ me?.name ?? 'Seu nome' }}</span>
            <span v-if="crpLine" class="font-mono text-[12px] text-muted-foreground">{{ crpLine }}</span>
          </span>
          <span class="font-mono text-[12px] text-muted-foreground">{{ doc?.code ?? 'Código gerado na emissão' }}</span>
        </header>
        <h2 class="text-center text-xl font-semibold tracking-[-0.01em]">{{ preview.title }}</h2>
        <p>{{ preview.body }}</p>
        <ul v-if="preview.dates.length" class="flex list-disc flex-col gap-1 pl-5">
          <li v-for="d in preview.dates" :key="d">{{ d }}</li>
        </ul>
        <p v-else class="text-muted-foreground">[selecione as sessões]</p>
        <p v-if="preview.purpose">{{ preview.purpose }}</p>
        <p class="pt-2">{{ preview.placeAndDate }}</p>
        <div class="flex flex-col items-center gap-0.5 pt-6">
          <span class="w-56 max-w-full border-t border-foreground/40" aria-hidden="true" />
          <span class="pt-1 font-medium">{{ me?.name ?? 'Seu nome' }}</span>
          <span class="font-mono text-[12px] text-muted-foreground">{{ me?.crp ? `CRP ${me.crp}` : '' }}</span>
        </div>
        <footer class="flex items-center gap-2 border-t pt-4 font-mono text-[11px] text-muted-foreground">
          <FileText class="size-3.5" aria-hidden="true" />
          Código do documento: {{ doc?.code ?? 'gerado na emissão' }}
        </footer>
      </article>
    </section>
  </div>
</template>
