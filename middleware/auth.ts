import type { User } from '~/types'
import { authRedirect } from '~/utils/patient-portal'
import { DEPARTURE_EXPORT_PATH, INACTIVE_WORKSPACE_PATH, homeFor } from '~/utils/workspace'

// Protege rotas autenticadas. Roda no servidor e no cliente.
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: user } = await useFetch<User | null>('/api/me', { key: 'me' })
  const redirect = authRedirect(user.value)
  if (redirect) return navigateTo(redirect)
  // Vínculo suspenso/encerrado: a API recusa os dados; a tela explica e
  // oferece os outros workspaces (ADR 0002). Baixar os cadernos da clínica
  // que ela deixou (ACO-96) continua liberado.
  if (user.value?.workspace && !user.value.workspace.active && to.path !== INACTIVE_WORKSPACE_PATH && to.path !== DEPARTURE_EXPORT_PATH) {
    return navigateTo(INACTIVE_WORKSPACE_PATH)
  }
  // Vínculo ativo (ex.: reativado pela clínica) não fica preso na página.
  if (to.path === INACTIVE_WORKSPACE_PATH && user.value?.workspace?.active !== false) {
    return navigateTo(homeFor(user.value))
  }
})
