import type { TimelineEvent } from '~/types'
import { idParamSchema } from '~/schemas/common'
import { activityStatusMeta, appointmentStatusLabel, sessionStatusMeta } from '~/utils/format'

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

// A API devolve o status cru (`completed`, `reviewed`…); a tela mostra o rótulo
// em português de cada tipo, o mesmo das listagens.
function statusLabel(kind: string, status: string): string {
  if (kind === 'session') return sessionStatusMeta(status).label
  if (kind === 'appointment') return appointmentStatusLabel(status)
  if (kind === 'activity') return activityStatusMeta(status).label
  return status
}

// Timeline do paciente — proxy autenticado. Consumida pela ACO-21 (island/lazy).
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const items = await apiFetch<ApiTimelineItem[]>(event, `/sessions/timeline/${id}`)
  return items.map<TimelineEvent>(item => ({
    id: item.itemId,
    type: item.kind,
    title: titles[item.kind] ?? item.kind,
    description: statusLabel(item.kind, item.status),
    at: item.occurredAt,
  }))
})
