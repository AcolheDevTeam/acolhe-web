import { defineStore } from 'pinia'
import type { Organization, User } from '~/types'

// Perfil do usuário logado — usado em toda a app.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    org: null as Organization | null,
  }),
  getters: {
    isPsychologist: (state) => state.user?.role === 'psychologist',
    isPatient: (state) => state.user?.role === 'patient',
    isOrgAdmin: (state) => state.user?.role === 'org_admin',
  },
})
