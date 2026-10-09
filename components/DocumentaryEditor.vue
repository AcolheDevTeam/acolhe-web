<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import {
  documentaryCategories,
  documentaryContentSchema,
  documentaryHistorySchema,
  notebooksSchema,
  notebookSchema,
  versionSchema,
  type DocumentaryCategory,
  type Notebook,
  type NotebookVersion,
  type DocumentaryHistory,
} from '~/schemas/documentary'

const props = defineProps<{ patientId: string }>()
const identity = useDocumentaryIdentity()
const initialIdentity = identity.value
const requestFetch = useRequestFetch()
const { data, error, status, refresh, clear } = await useDocumentaryPatient(
  () => props.patientId,
)
const category = ref<DocumentaryCategory>('hypothesis')
const saved = ref<Notebook | null>(null)
const draft = ref('')
const initialized = ref(false)
const saving = ref(false)
const message = ref('')
const failure = ref('')
// 401 ao salvar: a pessoa entra de novo em outra aba e o rascunho fica aqui (ACO-77).
const sessionLost = ref(false)
const historyError = ref('')
const history = ref<DocumentaryHistory | null>(null)
const historyBusy = ref(false)
const selectedVersion = ref<NotebookVersion | null>(null)
const comparedVersion = ref<NotebookVersion | null>(null)
const comparisonRevision = ref('')
const versionOpen = ref(false)
const versionBusy = ref(false)
const conflictOpen = ref(false)
const latest = ref<Notebook | null>(null)
const conflicted = ref(false)
const confirmOpen = ref(false)
let resolveConfirmation: ((value: boolean) => void) | undefined
const exitProtection = useNuxtApp().$protectedLogout
const unregisterExit = exitProtection.register({ saving, confirm: confirmDiscard })
onBeforeUnmount(unregisterExit)
const dirty = computed(() => draft.value !== (saved.value?.content ?? ''))
const writable = computed(
  () =>
    data.value?.patient.writable === true && identity.value === initialIdentity,
)
const contentValid = computed(
  () => documentaryContentSchema.safeParse(draft.value).success,
)
const canSave = computed(
  () =>
    dirty.value &&
    writable.value &&
    !saving.value &&
    !exitProtection.pending.value &&
    contentValid.value &&
    !conflicted.value,
)
const categoryLabel = computed(
  () => documentaryCategories.find((c) => c.value === category.value)?.label,
)
const errorText = (err: unknown) =>
  apiErrorMessage(err, {
    400: 'Confira a revisão, a categoria e o limite de 200.000 bytes do texto.',
    403: 'Paciente ou vínculo clínico inativo. O caderno está disponível somente para leitura.',
    404: 'Este caderno ou esta versão não está disponível para sua conta.',
    409: 'Este caderno foi atualizado em outra aba. Compare os textos antes de tentar novamente.',
    503: 'Não foi possível validar a criptografia do caderno. O conteúdo foi preservado; solicite a verificação da configuração.',
  })
function isCurrent() {
  return identity.value === initialIdentity
}
function confirmDiscard(): Promise<boolean> {
  if (saving.value) return Promise.resolve(false)
  if (!dirty.value) return Promise.resolve(true)
  if (resolveConfirmation) return Promise.resolve(false)
  confirmOpen.value = true
  return new Promise((resolve) => {
    resolveConfirmation = resolve
  })
}
function decide(discard: boolean) {
  confirmOpen.value = false
  resolveConfirmation?.(discard)
  resolveConfirmation = undefined
}
function adopt(notebook: Notebook | null) {
  saved.value = notebook
  draft.value = notebook?.content ?? ''
  conflicted.value = false
  latest.value = null
  message.value = ''
  failure.value = ''
}
async function loadHistory(page = 1) {
  history.value = null
  historyError.value = ''
  if (!saved.value) return
  const recordId = saved.value.id
  historyBusy.value = true
  try {
    const result = documentaryHistorySchema.parse(
      await requestFetch(`/api/documentary/notebooks/${recordId}/versions`, {
        query: { page, pageSize: 10 },
      }),
    )
    if (isCurrent() && saved.value?.id === recordId) history.value = result
  } catch (err) {
    if (isCurrent()) historyError.value = errorText(err)
  } finally {
    historyBusy.value = false
  }
}
watch(
  data,
  (value) => {
    if (value && !initialized.value && isCurrent()) {
      initialized.value = true
      adopt(
        value.items.find((item) => item.category === category.value) ?? null,
      )
      void loadHistory()
    }
  },
  { immediate: true },
)
async function changeCategory(next: DocumentaryCategory) {
  if (next === category.value || !(await confirmDiscard())) return
  category.value = next
  adopt(data.value?.items.find((item) => item.category === next) ?? null)
  selectedVersion.value = null
  comparedVersion.value = null
  versionOpen.value = false
  await loadHistory()
}
function updatePersisted(value: Notebook) {
  if (!isCurrent()) return
  clearNuxtData((key) => key.startsWith('documentary-list-'))
  if (data.value)
    data.value = {
      ...data.value,
      items: [
        ...data.value.items.filter((item) => item.category !== value.category),
        value,
      ],
    }
  adopt(value)
  message.value = `Versão ${value.revision} salva.`
}
async function inspectLatest() {
  failure.value = ''
  try {
    const result = notebooksSchema.parse(
      await requestFetch(`/api/documentary/patients/${props.patientId}`),
    )
    if (!isCurrent()) return
    latest.value =
      result.items.find((item) => item.category === category.value) ?? null
    if (data.value) data.value.patient.writable = result.patient.writable
    conflictOpen.value = true
  } catch (err) {
    if (isCurrent()) failure.value = errorText(err)
  }
}
async function persist(restoreRevision?: number) {
  if (
    saving.value ||
    !writable.value ||
    (restoreRevision === undefined && !canSave.value)
  )
    return
  saving.value = true
  failure.value = ''
  sessionLost.value = false
  message.value = ''
  try {
    const base = `/api/documentary/patients/${props.patientId}/${category.value}`
    const response = await requestFetch(
      restoreRevision === undefined ? base : `${base}/restore`,
      {
        method: restoreRevision === undefined ? 'PUT' : 'POST',
        body:
          restoreRevision === undefined
            ? {
                content: draft.value,
                expectedRevision: saved.value?.revision ?? 0,
              }
            : {
                revision: restoreRevision,
                expectedRevision: saved.value?.revision ?? 0,
              },
      },
    )
    if (!isCurrent()) return
    updatePersisted(notebookSchema.parse(response))
    versionOpen.value = false
    await loadHistory()
  } catch (err: any) {
    if (!isCurrent()) return
    failure.value = errorText(err)
    const code = err?.statusCode ?? err?.status ?? err?.response?.status
    if (code === 409) {
      conflicted.value = true
      await inspectLatest()
    }
    if (code === 403 && data.value) data.value.patient.writable = false
    if (code === 401) sessionLost.value = true
  } finally {
    saving.value = false
  }
}
async function openVersion(revision: number) {
  if (!saved.value) return
  versionBusy.value = true
  historyError.value = ''
  comparedVersion.value = null
  const id = saved.value.id
  try {
    const result = versionSchema.parse(
      await requestFetch(
        `/api/documentary/notebooks/${id}/versions/${revision}`,
      ),
    )
    if (!isCurrent() || saved.value?.id !== id) return
    selectedVersion.value = result
    versionOpen.value = true
    comparisonRevision.value = revision > 1 ? String(revision - 1) : ''
    if (revision > 1) await compareVersion(String(revision - 1))
  } catch (err) {
    if (isCurrent()) historyError.value = errorText(err)
  } finally {
    versionBusy.value = false
  }
}
async function compareVersion(revision: string) {
  if (!saved.value || !revision) {
    comparedVersion.value = null
    return
  }
  comparedVersion.value = null
  try {
    const result = versionSchema.parse(
      await requestFetch(
        `/api/documentary/notebooks/${saved.value.id}/versions/${revision}`,
      ),
    )
    if (isCurrent()) comparedVersion.value = result
  } catch (err) {
    if (isCurrent()) historyError.value = errorText(err)
  }
}
const comparisonOptions = computed(() => {
  const revisions = new Set(
    (history.value?.items ?? []).map((item) => item.revision),
  )
  if (selectedVersion.value && selectedVersion.value.revision > 1)
    revisions.add(selectedVersion.value.revision - 1)
  return [...revisions]
    .sort((a, b) => b - a)
    .map((revision) => ({
      value: String(revision),
      label: `Versão ${revision}`,
    }))
})
async function useVersion() {
  if (!selectedVersion.value || !(await confirmDiscard())) return
  draft.value = selectedVersion.value.content
  versionOpen.value = false
  message.value = 'Versão carregada no editor. Clique em Salvar para gravar.'
}
async function restoreVersion() {
  if (!selectedVersion.value || !(await confirmDiscard())) return
  await persist(selectedVersion.value.revision)
}
function rebaseDraft() {
  // Explicit user decision only: preserve draft, acknowledge remote revision, require Save.
  saved.value = latest.value
  if (latest.value && data.value)
    data.value = {
      ...data.value,
      items: [
        ...data.value.items.filter((item) => item.category !== category.value),
        latest.value,
      ],
    }
  conflicted.value = false
  conflictOpen.value = false
  failure.value = ''
  message.value =
    'Revisão atual reconhecida. Revise seu texto e clique em Salvar quando desejar.'
  void loadHistory()
}
async function useLatest() {
  if (!(await confirmDiscard())) return
  if (latest.value && data.value)
    data.value = {
      ...data.value,
      items: [
        ...data.value.items.filter((item) => item.category !== category.value),
        latest.value,
      ],
    }
  adopt(latest.value)
  conflictOpen.value = false
  void loadHistory()
}
const beforeUnload = (event: BeforeUnloadEvent) => {
  if (!exitProtection.leaving.value && (dirty.value || saving.value)) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  decide(false)
  draft.value = ''
  saved.value = null
  selectedVersion.value = null
  comparedVersion.value = null
  latest.value = null
  clear()
})
onBeforeRouteLeave(() => confirmDiscard())
onBeforeRouteUpdate((to, from) =>
  to.params.id !== from.params.id ? confirmDiscard() : true,
)
watch(
  identity,
  () => {
    draft.value = ''
    saved.value = null
    selectedVersion.value = null
    comparedVersion.value = null
    latest.value = null
    history.value = null
    clear()
    decide(false)
  },
  { flush: 'sync' },
)
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <div v-if="error" role="alert" class="space-y-3">
      <p>{{ errorText(error) }}</p>
      <Button variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <p
      v-else-if="!initialized || status === 'pending'"
      class="text-sm text-muted-foreground"
    >
      Carregando cadernos…
    </p>
    <template v-else-if="data">
      <header class="space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="font-serif text-2xl">{{ data.patient.fullName }}</h2>
          <Badge v-if="!writable" variant="secondary">Somente leitura</Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          Espaço privado da autora. Salvamento manual, sem cópia de rascunho no
          navegador.
        </p>
        <p v-if="!writable" class="text-sm">
          Paciente ou vínculo clínico inativo. Você pode consultar os cadernos e
          o histórico.
        </p>
      </header>
      <nav aria-label="Categorias do caderno" class="flex flex-wrap gap-2">
        <Button
          v-for="item in documentaryCategories"
          :key="item.value"
          :variant="category === item.value ? 'default' : 'outline'"
          size="sm"
          :aria-pressed="category === item.value"
          :disabled="saving || exitProtection.pending.value"
          @click="changeCategory(item.value)"
          >{{ item.label }}</Button
        >
      </nav>
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section class="min-w-0 space-y-4 rounded-lg border bg-card p-4 md:p-6">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label for="documentary-content" class="label-mono">{{
              categoryLabel
            }}</label
            ><span class="text-xs text-muted-foreground">{{
              saved ? `Versão ${saved.revision}` : 'Caderno ainda não iniciado'
            }}</span>
          </div>
          <Textarea
            id="documentary-content"
            v-model="draft"
            :readonly="!writable || saving || exitProtection.pending.value"
            class="min-h-[360px] resize-y whitespace-pre-wrap text-base leading-relaxed"
            placeholder="Escreva suas anotações nesta categoria…"
            :aria-invalid="!contentValid"
          />
          <p v-if="!contentValid" class="text-sm text-destructive">
            O texto excede o limite de 200.000 bytes. Reduza o conteúdo antes de
            salvar.
          </p>
          <p v-if="failure" role="alert" class="text-sm text-destructive">
            {{ failure }}
          </p>
          <p v-if="sessionLost" class="text-sm text-muted-foreground">
            Seu texto continua aqui.
            <NuxtLink to="/login" target="_blank" class="underline underline-offset-4 hover:text-foreground">Entre novamente em outra aba</NuxtLink>
            e depois salve de novo.
          </p>
          <p v-if="message" role="status" class="text-sm text-muted-foreground">
            {{ message }}
          </p>
          <div
            v-if="conflicted"
            class="space-y-2 rounded-lg border p-3 text-sm"
          >
            <p>
              Seu texto foi preservado. Consulte a revisão atual antes de salvar
              novamente.
            </p>
            <Button variant="outline" @click="inspectLatest()"
              >Consultar versão mais recente</Button
            >
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="text-xs text-muted-foreground">{{
              dirty
                ? 'Alterações não salvas'
                : saved
                  ? 'Conteúdo salvo'
                  : 'Nenhum conteúdo salvo'
            }}</span
            ><Button :disabled="!canSave" @click="persist()">{{
              saving ? 'Salvando…' : 'Salvar'
            }}</Button>
          </div>
        </section>
        <aside class="min-w-0 space-y-4">
          <h3 class="label-mono">Histórico de versões</h3>
          <p v-if="!saved" class="text-sm text-muted-foreground">
            O primeiro salvamento inicia o histórico.
          </p>
          <p v-if="historyBusy" class="text-sm text-muted-foreground">
            Carregando histórico…
          </p>
          <div v-if="historyError" role="alert" class="space-y-2 text-sm">
            <p>{{ historyError }}</p>
            <Button variant="outline" @click="loadHistory()"
              >Tentar novamente</Button
            >
          </div>
          <template v-if="history"
            ><div class="divide-y rounded-lg border">
              <button
                v-for="version in history.items"
                :key="version.id"
                class="flex w-full flex-col gap-1 p-3 text-left text-sm hover:bg-muted/40 disabled:opacity-50"
                :disabled="versionBusy || saving"
                @click="openVersion(version.revision)"
              >
                <span class="font-medium">Versão {{ version.revision }}</span
                ><span class="text-xs text-muted-foreground">{{
                  new Date(version.createdAt).toLocaleString('pt-BR')
                }}</span
                ><span
                  v-if="version.restoredFrom"
                  class="text-xs text-muted-foreground"
                  >Restaurada da versão {{ version.restoredFrom }}</span
                >
              </button>
            </div>
            <PaginationControls
              :page="history.page"
              :total-pages="history.totalPages"
              :total-count="history.totalCount"
              :busy="historyBusy"
              @change="loadHistory"
          /></template>
        </aside>
      </div>
    </template>
    <Dialog v-model:open="versionOpen"
      ><DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-5xl"
        ><DialogHeader
          ><DialogTitle>Versão {{ selectedVersion?.revision }}</DialogTitle
          ><DialogDescription
            >Consulte o texto salvo, compare versões ou carregue-o no
            editor.</DialogDescription
          ></DialogHeader
        ><template v-if="selectedVersion">
          <pre
            class="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border p-4 font-sans text-sm"
            >{{ selectedVersion.content || '(texto vazio)' }}</pre
          >
          <CustomDropdown
            v-model="comparisonRevision"
            :options="comparisonOptions"
            placeholder="Comparar com versão…"
            search-placeholder="Buscar versão…"
            @update:model-value="compareVersion"
          /><TextComparison
            v-if="comparedVersion"
            :before="comparedVersion.content"
            :after="selectedVersion.content"
            :before-label="`Removido · versão ${comparedVersion.revision}`"
            :after-label="`Adicionado · versão ${selectedVersion.revision}`"
          /><DialogFooter
            ><Button
              variant="outline"
              :disabled="!writable || saving || exitProtection.pending.value"
              @click="useVersion"
              >Usar no editor</Button
            ><Button
              :disabled="!writable || saving || conflicted || exitProtection.pending.value"
              @click="restoreVersion"
              >{{ saving ? 'Restaurando…' : 'Restaurar esta versão' }}</Button
            ></DialogFooter
          ></template
        ></DialogContent
      ></Dialog
    >
    <Dialog v-model:open="conflictOpen"
      ><DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-5xl"
        ><DialogHeader
          ><DialogTitle>O caderno mudou em outra aba</DialogTitle
          ><DialogDescription
            >Compare seu texto com a versão {{ latest?.revision ?? 0 }}. Nenhuma
            alteração foi reenviada.</DialogDescription
          ></DialogHeader
        >
        <pre
          class="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border p-4 font-sans text-sm"
          >{{ latest?.content || '(texto vazio)' }}</pre
        >
        <TextComparison
          :before="latest?.content ?? ''"
          :after="draft"
          before-label="Na versão mais recente"
          after-label="No seu texto"
        /><DialogFooter
          ><Button variant="outline" @click="useLatest"
            >Usar versão mais recente</Button
          ><Button :disabled="!writable" @click="rebaseDraft"
            >Manter meu texto para revisar</Button
          ></DialogFooter
        ></DialogContent
      ></Dialog
    >
    <UnsavedChangesDialog :open="confirmOpen" @decision="decide" />
  </div>
</template>
