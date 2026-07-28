import type { ActivityTemplate } from '~/types'

// Templates de atividade (biblioteca) — usados no form de atribuir atividade.
export default defineEventHandler(async (event) => {
  return await apiFetch<ActivityTemplate[]>(event, '/activities/templates')
})
