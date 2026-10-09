import type { Workspace } from '~/types'

// Vínculos da pessoa para a troca de workspace (só nome e tipo das organizações).
export default defineEventHandler(async (event) => {
  return await apiFetch<Workspace[]>(event, '/workspaces')
})
