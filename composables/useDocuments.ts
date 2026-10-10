import { toast } from 'vue-sonner'
import type { ClinicalDocument, ClinicalDocumentLink } from '~/types'

// Documentos emitidos (ACO-100). A chave inclui o contexto (todas ou uma
// paciente) para não cruzar cache entre pacientes (LGPD).
export function useDocuments(patientId?: MaybeRefOrGetter<string | undefined>) {
  const id = toRef(patientId)
  return useFetch<ClinicalDocument[]>('/api/documents', {
    query: computed(() => (id.value ? { patientId: id.value } : {})),
    key: () => `documents-${id.value || 'all'}`,
    default: () => [],
  })
}

/**
 * Acompanha a geração de um PDF: consulta o documento até sair de "pending".
 * Para no unmount e desiste depois de `timeoutMs` (o documento continua na
 * lista de emitidos quando ficar pronto).
 */
export function useDocumentProgress(intervalMs = 1500, timeoutMs = 120_000) {
  const document = ref<ClinicalDocument | null>(null)
  const timedOut = ref(false)
  const error = ref<unknown>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  let startedAt = 0

  function stop() {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  async function poll() {
    if (!document.value) return
    try {
      const fresh = await $fetch<ClinicalDocument>(`/api/documents/${document.value.id}`)
      document.value = fresh
      error.value = null
    }
    catch (err) {
      // Uma falha de rede no meio não encerra o acompanhamento.
      error.value = err
    }
    if (document.value?.status !== 'pending') return stop()
    if (Date.now() - startedAt >= timeoutMs) {
      timedOut.value = true
      return stop()
    }
    timer = setTimeout(poll, intervalMs)
  }

  function track(doc: ClinicalDocument) {
    stop()
    document.value = doc
    timedOut.value = false
    startedAt = Date.now()
    if (doc.status === 'pending') timer = setTimeout(poll, intervalMs)
  }

  function reset() {
    stop()
    document.value = null
    timedOut.value = false
    error.value = null
  }

  onBeforeUnmount(stop)
  return { document, timedOut, error, track, reset }
}

/**
 * Baixar e copiar sempre pedem um link novo (24 horas) ao BFF: o link anterior
 * pode ter expirado e nunca fica guardado no navegador.
 */
export function useDocumentLinkActions(onIssued?: (doc: Pick<ClinicalDocument, 'id'>, link: ClinicalDocumentLink) => void) {
  const busyId = ref<string | null>(null)

  async function issue(doc: Pick<ClinicalDocument, 'id'>): Promise<ClinicalDocumentLink | null> {
    busyId.value = doc.id
    try {
      const link = await $fetch<ClinicalDocumentLink>(`/api/documents/${doc.id}/link`, { method: 'POST' })
      onIssued?.(doc, link)
      return link
    }
    catch (err) {
      toast.error(apiErrorMessage(err, DOCUMENT_LINK_ERRORS))
      return null
    }
    finally {
      busyId.value = null
    }
  }

  async function download(doc: Pick<ClinicalDocument, 'id'>) {
    // A aba abre já no clique: aberta depois do await, o navegador a bloquearia.
    const tab = window.open('', '_blank')
    const link = await issue(doc)
    if (!link) {
      tab?.close()
      return
    }
    if (tab) {
      tab.opener = null
      tab.location.href = link.url
    }
    else {
      window.location.href = link.url
    }
  }

  async function copy(doc: Pick<ClinicalDocument, 'id'>) {
    const link = await issue(doc)
    if (!link) return
    try {
      await navigator.clipboard.writeText(link.url)
      toast.success('Link copiado. Vale por 24 horas.')
    }
    catch {
      toast.error('Não foi possível copiar o link. Use "Baixar" para abrir o PDF.')
    }
  }

  return { busyId, download, copy }
}
