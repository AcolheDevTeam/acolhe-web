import { defineStore } from 'pinia'

// Preferências de UI do psicólogo.
export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    sidebarCollapsed: false,
    defaultView: 'week' as 'day' | 'week' | 'month',
  }),
  persist: true,
})
