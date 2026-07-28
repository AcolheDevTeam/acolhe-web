import type { TimelineEvent } from '~/types'

interface ApiTimelineItem {
  itemId: string
  kind: string
  occurredAt: string
  status: string
}

const titles: Record<string, string> = {
  session: 'Sessão clínica',
  appointment: 'Agendamento',
  activity: 'Atividade',
}

// Timeline do paciente — proxy autenticado. Consumida pela ACO-21 (island/lazy).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const items = await apiFetch<ApiTimelineItem[]>(event, `/sessions/timeline/${id}`)
  return items.map<TimelineEvent>(item => ({
    id: item.itemId,
    type: item.kind,
    title: titles[item.kind] ?? item.kind,
    description: item.status,
    at: item.occurredAt,
  }))
})
