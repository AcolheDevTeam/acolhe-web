import type { TimelineEvent } from '~/types'
import { idParamSchema } from '~/schemas/common'

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
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const items = await apiFetch<ApiTimelineItem[]>(event, `/sessions/timeline/${id}`)
  return items.map<TimelineEvent>(item => ({
    id: item.itemId,
    type: item.kind,
    title: titles[item.kind] ?? item.kind,
    description: item.status,
    at: item.occurredAt,
  }))
})
