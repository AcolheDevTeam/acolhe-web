import { defineStore } from 'pinia'

// Rascunho de prontuário — persiste entre navegações (não se perde no localStorage).
export const useClinicalDraftStore = defineStore('clinicalDraft', {
  state: () => ({
    sessionId: null as string | null,
    content: '',
    lastSaved: null as string | null,
  }),
  persist: true,
})
