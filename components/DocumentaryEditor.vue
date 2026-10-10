<script setup lang="ts">
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoiceChips } from '@/components/ui/choice-chips'
import { InlineNotice } from '@/components/ui/inline-notice'
import { SaveStatus } from '@/components/ui/save-status'
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

// initialCategory: categoria aberta primeiro (ex.: escolhida em "Abrir caderno").
const props = defineProps<{ patientId: string, initialCategory?: DocumentaryCategory }>()
// A página guarda a categoria na URL para o recarregamento abrir a mesma.
const emit = defineEmits<{ categoryChange: [category: DocumentaryCategory] }>()
const identity = useDocumentaryIdentity()
const initialIdentity = identity.value
const requestFetch = useRequestFetch()
const { data, error, status, refresh, clear } = await useDocumentaryPatient(
  () => props.patientId,
)
const category = ref<DocumentaryCategory>(props.initialCategory ?? 'hypothesis')
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
// Caderno que não decifrou (ACO-86): fica só leitura, sem texto, até a
// chave voltar. Os outros cadernos da paciente seguem normais.
const unreadable = computed(() => saved.value?.unreadable === true)
const writable = computed(
  () =>
    data.value?.patient.writable === true &&
    identity.value === initialIdentity &&
    !unreadable.value,
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
const categoryOptions = documentaryCategories.map((c) => ({ ...c }))
const saveState = computed(() =>
  saving.value
    ? 'saving'
    : failure.value
      ? 'error'
      : dirty.value
        ? 'dirty'
        : saved.value
          ? 'saved'
          : 'idle',
)
const errorText = documentaryErrorText
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
  emit('categoryChange', next)
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
  // "Salvo · versão N" sai pelo SaveStatus; sem segundo aviso igual.
  adopt(value)
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
    if (code === 403 && documentaryForbiddenReason(err) === 'read_only' && data.value)
      data.value.patient.writable = false
    if (code === 401) sessionLost.value = true
  } finally {
    saving.value = false
  }
}
async function openVersion(revision: number) {
  if (!saved.value) return
  compareRequest++ // invalida a comparação pendente da versão anterior
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
// Só a comparação pedida por último pode preencher a tela (ACO-84).
let compareRequest = 0
async function compareVersion(revision: string) {
  const request = ++compareRequest
  if (!saved.value || !revision) {
    comparedVersion.value = null
    return
  }
  comparedVersion.value = null
  const id = saved.value.id
  try {
    const result = versionSchema.parse(
      await requestFetch(
        `/api/documentary/notebooks/${id}/versions/${revision}`,
      ),
    )
    if (isCurrent() && request === compareRequest && saved.value?.id === id)
      comparedVersion.value = result
  } catch (err) {
    if (isCurrent() && request === compareRequest)
      historyError.value = errorText(err)
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
// "Restaurar" na linha do histórico (protótipo) pede confirmação antes, já que
// a pessoa não está vendo o texto daquela versão.
const restoreTarget = ref<number | null>(null)
async function decideRestore(confirmed: boolean) {
  const revision = restoreTarget.value
  restoreTarget.value = null
  if (!confirmed || revision === null || !(await confirmDiscard())) return
  await persist(revision)
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
  <div class="flex flex-col gap-6">
    <div v-if="error" role="alert" class="space-y-3">
      <p class="text-sm text-destructive">{{ errorText(error) }}</p>
      <p v-if="isSessionExpired(error)" class="text-sm text-muted-foreground">
        <NuxtLink to="/login" target="_blank" class="underline underline-offset-4 hover:text-foreground">Entrar novamente em outra aba</NuxtLink>
        e depois tentar de novo.
      </p>
      <Button variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <p
      v-else-if="!initialized || status === 'pending'"
      class="text-sm text-muted-foreground"
    >
      Carregando cadernos…
    </p>
    <template v-else-if="data">
      <InlineNotice v-if="unreadable" tone="warning">
        <span class="font-medium">Não foi possível abrir este caderno.</span>
        O texto continua guardado, mas não pôde ser lido agora. Enquanto isso,
        ele não pode ser editado. Recarregue a página mais tarde para tentar
        de novo.
      </InlineNotice>
      <InlineNotice v-else-if="!writable" tone="neutral">
        <span class="font-medium text-foreground">Somente leitura.</span>
        Paciente ou vínculo clínico inativo. Você pode consultar os cadernos e
        o histórico.
      </InlineNotice>
      <ChoiceChips
        variant="strong"
        manual
        label="Categorias do caderno"
        :options="categoryOptions"
        :model-value="category"
        :disabled="saving || exitProtection.pending.value"
        @update:model-value="changeCategory($event as DocumentaryCategory)"
      />
      <div class="flex flex-wrap items-start gap-6">
        <Card
          role="region"
          aria-labelledby="documentary-content-label"
          class="flex min-w-0 flex-[3_1_420px] flex-col gap-4 p-5 md:p-6"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label id="documentary-content-label" for="documentary-content" class="label-mono">{{
              categoryLabel
            }}</label>
            <span v-if="saveState === 'idle'" class="font-mono text-xs text-muted-foreground">Caderno ainda não iniciado</span>
            <SaveStatus :state="saveState" :version="saved?.revision" />
          </div>
          <Textarea
            id="documentary-content"
            v-model="draft"
            :readonly="!writable || saving || exitProtection.pending.value"
            class="min-h-[360px] resize-y whitespace-pre-wrap leading-[1.6]"
            :placeholder="unreadable ? '' : 'Escreva suas anotações nesta categoria…'"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            :aria-invalid="!contentValid"
          />
          <InlineNotice v-if="!contentValid" tone="danger">
            O texto excede o limite de 200.000 bytes. Reduza o conteúdo antes de
            salvar.
          </InlineNotice>
          <InlineNotice v-if="failure" tone="danger">{{ failure }}</InlineNotice>
          <InlineNotice v-if="sessionLost" tone="neutral">
            Seu texto continua aqui.
            <NuxtLink to="/login" target="_blank" class="underline underline-offset-4 hover:text-foreground">Entre novamente em outra aba</NuxtLink>
            e depois salve de novo.
          </InlineNotice>
          <InlineNotice v-if="message">{{ message }}</InlineNotice>
          <InlineNotice
            v-if="conflicted"
            tone="warning"
            class="flex flex-wrap items-center justify-between gap-3"
          >
            <span>
              Seu texto foi preservado. Consulte a revisão atual antes de salvar
              novamente.
            </span>
            <Button variant="outline" size="sm" @click="inspectLatest()"
              >Consultar versão mais recente</Button
            >
          </InlineNotice>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button :disabled="!canSave" @click="persist()">{{
              saving ? 'Salvando…' : 'Salvar'
            }}</Button>
            <span class="text-[13px] text-muted-foreground">
              Salvamento manual, sem cópia de rascunho no navegador.
            </span>
          </div>
        </Card>
        <Card
          role="region"
          aria-labelledby="documentary-history-title"
          class="flex min-w-0 flex-[2_1_300px] flex-col gap-3 p-5 md:p-6"
        >
          <h3 id="documentary-history-title" class="label-mono">
            Histórico{{ history ? ` · ${history.totalCount} ${history.totalCount === 1 ? 'versão' : 'versões'}` : '' }}
          </h3>
          <p v-if="!saved" class="text-sm text-muted-foreground">
            O primeiro salvamento inicia o histórico.
          </p>
          <p v-if="historyBusy" class="text-sm text-muted-foreground">
            Carregando histórico…
          </p>
          <div v-if="historyError" role="alert" class="space-y-2 text-sm">
            <p class="text-destructive">{{ historyError }}</p>
            <Button variant="outline" @click="loadHistory()"
              >Tentar novamente</Button
            >
          </div>
          <template v-if="history">
            <ol class="flex flex-col">
              <li
                v-for="version in history.items"
                :key="version.id"
                class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-secondary py-2.5 first:border-t-0"
              >
                <span class="flex min-w-0 flex-col gap-0.5">
                  <button
                    type="button"
                    class="w-fit rounded-sm text-left text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:opacity-45"
                    :disabled="versionBusy || saving"
                    :aria-label="`Ver a versão ${version.revision}`"
                    @click="openVersion(version.revision)"
                  >
                    <span :class="version.revision === saved?.revision ? 'font-semibold' : ''">Versão {{ version.revision }}</span>
                    <span v-if="version.revision === saved?.revision" class="text-muted-foreground"> · atual</span>
                  </button>
                  <span class="font-mono text-xs text-muted-foreground">{{ formatDateTime(version.createdAt) }}</span>
                  <span
                    v-if="version.restoredFrom"
                    class="text-xs text-muted-foreground"
                    >Restaurada da versão {{ version.restoredFrom }}</span
                  >
                </span>
                <Button
                  v-if="version.revision !== saved?.revision"
                  variant="ghost"
                  size="xs"
                  class="text-primary hover:bg-accent hover:text-primary"
                  :disabled="!writable || saving || conflicted || versionBusy || exitProtection.pending.value"
                  :aria-label="`Restaurar a versão ${version.revision}`"
                  @click="restoreTarget = version.revision"
                  >Restaurar</Button
                >
              </li>
            </ol>
            <PaginationControls
              :page="history.page"
              :total-pages="history.totalPages"
              :total-count="history.totalCount"
              :busy="historyBusy"
              @change="loadHistory"
          /></template>
        </Card>
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
        <InlineNotice v-if="latest?.unreadable" tone="warning">
          A versão mais recente não pôde ser aberta agora, então não dá para
          comparar nem gravar por cima dela. Copie seu texto se quiser guardá-lo
          e recarregue a página mais tarde.
        </InlineNotice>
        <template v-else>
          <pre
            class="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border p-4 font-sans text-sm"
            >{{ latest?.content || '(texto vazio)' }}</pre
          >
          <TextComparison
            :before="latest?.content ?? ''"
            :after="draft"
            before-label="Na versão mais recente"
            after-label="No seu texto"
          />
        </template><DialogFooter
          ><Button variant="outline" @click="useLatest"
            >Usar versão mais recente</Button
          ><Button :disabled="!writable || latest?.unreadable === true" @click="rebaseDraft"
            >Manter meu texto para revisar</Button
          ></DialogFooter
        ></DialogContent
      ></Dialog
    >
    <UnsavedChangesDialog :open="confirmOpen" @decision="decide" />
    <ConfirmDialog
      :open="restoreTarget !== null"
      :title="`Restaurar a versão ${restoreTarget}?`"
      :description="`O texto da versão ${restoreTarget} vira a versão ${(saved?.revision ?? 0) + 1}, a atual. As versões anteriores continuam no histórico.`"
      confirm-label="Restaurar"
      @decision="decideRestore"
    />
  </div>
</template>
