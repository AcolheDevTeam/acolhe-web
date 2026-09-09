import type { ActivityTemplateDetail, ActivityTemplateSummary } from '~/schemas/activity-template'

// Biblioteca de templates da organização (+ globais da Acolhe).
export function useTemplates() {
  return useFetch<ActivityTemplateSummary[]>('/api/templates', {
    key: 'templates-list',
    default: () => [],
  })
}

export function useTemplate(templateId: MaybeRefOrGetter<string>) {
  const id = toRef(templateId)
  return useFetch<ActivityTemplateDetail>(() => `/api/templates/${id.value}`, {
    key: () => `template-${id.value}`,
  })
}
