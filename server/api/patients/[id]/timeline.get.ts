import type { TimelineEvent } from '~/types'

// Timeline do paciente — proxy autenticado. Consumida pela ACO-21 (island/lazy).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await apiFetch<TimelineEvent[]>(event, `/patients/${id}/timeline`)
})
