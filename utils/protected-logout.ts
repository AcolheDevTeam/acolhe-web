import { ref, watch, type Ref } from 'vue'

export interface ExitGuard {
  saving: Ref<boolean>
  confirm: () => Promise<boolean>
}

// Uma instância por aplicação Nuxt; nenhum texto clínico é guardado aqui.
export function createProtectedLogout() {
  const pending = ref(false)
  const leaving = ref(false)
  const guards = new Set<ExitGuard>()
  function register(guard: ExitGuard) {
    guards.add(guard)
    return () => guards.delete(guard)
  }
  async function logout(endSession: () => Promise<unknown>, leave: () => Promise<unknown>) {
    if (pending.value) return
    pending.value = true
    try {
      for (const guard of guards) {
        if (guard.saving.value) {
          await new Promise<void>((resolve) => {
            const stop = watch(guard.saving, saving => {
              if (!saving) { stop(); resolve() }
            })
          })
        }
        if (!(await guard.confirm())) return
      }
      await endSession()
      // Só suprime beforeunload após confirmação e encerramento bem-sucedido.
      leaving.value = true
      await leave()
    } catch (error) {
      leaving.value = false
      throw error
    } finally {
      if (!leaving.value) pending.value = false
    }
  }
  return { pending, leaving, register, logout }
}
