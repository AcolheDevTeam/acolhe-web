import type { User, Workspace } from '~/types'

// Troca de workspace (ADR 0002 da API). A troca recarrega a página inteira:
// nenhum dado em cache de um workspace pode aparecer no outro.
export function useWorkspaces(enabled: MaybeRefOrGetter<boolean> = true) {
  const { data: workspaces, refresh } = useFetch<Workspace[]>('/api/workspaces', {
    key: 'workspaces',
    default: () => [],
    immediate: toValue(enabled),
  })
  const switching = ref<string | null>(null)
  async function switchTo(organizationId: string) {
    if (switching.value) return
    switching.value = organizationId
    try {
      const user = await $fetch<User>(`/api/workspaces/${organizationId}/switch`, { method: 'POST' })
      clearNuxtData()
      await navigateTo(homeFor(user), { external: true, replace: true })
    }
    finally {
      switching.value = null
    }
  }
  return { workspaces, refresh, switching, switchTo }
}
