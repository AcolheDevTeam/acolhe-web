// Lógica reutilizável de atividades.
// Tipos co-localizados espelhando as projeções públicas da API Go
// (internal/activity/service.go).

export interface ActivityTemplate {
  id: string
  title: string
  description: string | null
  version: number
  createdAt: string
}

export interface ActivityAssignment {
  id: string
  templateId: string
  patientId: string
  status: string
  scheduledFor: string | null
  dueAt: string | null
  createdAt: string
}

export interface ActivityResponse {
  id: string
  assignmentId: string
  submittedAt: string | null
  isDraft: boolean
  createdAt: string
}

// Catálogo de templates disponíveis para a organização.
export function useActivityTemplates() {
  return useFetch<ActivityTemplate[]>('/api/activities/templates', {
    key: 'activity-templates',
  })
}

// Atribuições de um paciente. Chave por paciente — evita cache cruzado (LGPD).
export function usePatientAssignments(patientId: MaybeRefOrGetter<string>) {
  const id = toRef(patientId)
  return useFetch<ActivityAssignment[]>(() => `/api/activities/assignments`, {
    query: { patient: id },
    key: () => `assignments-${id.value}`,
  })
}

// Respostas de uma atribuição. Chave por atribuição.
export function useAssignmentResponses(assignmentId: MaybeRefOrGetter<string>) {
  const id = toRef(assignmentId)
  return useFetch<ActivityResponse[]>(() => `/api/activities/assignments/${id.value}/responses`, {
    key: () => `responses-${id.value}`,
  })
}
