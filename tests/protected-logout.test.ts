import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createProtectedLogout } from '../utils/protected-logout'

describe('saída protegida', () => {
  it('cancelar preserva a sessão e libera o botão', async () => {
    const flow = createProtectedLogout()
    flow.register({ saving: ref(false), confirm: vi.fn().mockResolvedValue(false) })
    const end = vi.fn(), leave = vi.fn()
    await flow.logout(end, leave)
    expect(end).not.toHaveBeenCalled()
    expect(leave).not.toHaveBeenCalled()
    expect(flow.pending.value).toBe(false)
    expect(flow.leaving.value).toBe(false)
  })
  it('encerra só após confirmação e dispensa beforeunload apenas após sucesso', async () => {
    const flow = createProtectedLogout()
    const order: string[] = []
    flow.register({ saving: ref(false), confirm: async () => { order.push('confirm'); return true } })
    await flow.logout(async () => {
      expect(flow.leaving.value).toBe(false)
      order.push('end')
    }, async () => {
      expect(flow.leaving.value).toBe(true)
      order.push('leave')
    })
    expect(order).toEqual(['confirm', 'end', 'leave'])
  })
  it('aguarda salvamento em andamento e ignora clique duplicado', async () => {
    const flow = createProtectedLogout(), saving = ref(true)
    const confirm = vi.fn().mockResolvedValue(true)
    flow.register({ saving, confirm })
    const end = vi.fn(), leave = vi.fn()
    const first = flow.logout(end, leave)
    await flow.logout(end, leave)
    expect(confirm).not.toHaveBeenCalled()
    expect(end).not.toHaveBeenCalled()
    saving.value = false
    await nextTick()
    await first
    expect(end).toHaveBeenCalledTimes(1)
  })
  it('falha no logout mantém a proteção e permite tentar novamente', async () => {
    const flow = createProtectedLogout()
    const confirm = vi.fn().mockResolvedValue(true)
    flow.register({ saving: ref(false), confirm })
    const leave = vi.fn()
    await expect(flow.logout(async () => { throw new Error('offline') }, leave)).rejects.toThrow('offline')
    expect(leave).not.toHaveBeenCalled()
    expect(flow.pending.value).toBe(false)
    expect(flow.leaving.value).toBe(false)
    await flow.logout(vi.fn(), leave)
    expect(confirm).toHaveBeenCalledTimes(2)
  })
  it('remove editores desmontados e isola instâncias da aplicação', async () => {
    const flow = createProtectedLogout()
    const confirm = vi.fn().mockResolvedValue(false)
    const unregister = flow.register({ saving: ref(false), confirm })
    const other = createProtectedLogout(), end = vi.fn()
    await other.logout(end, vi.fn())
    unregister()
    await flow.logout(end, vi.fn())
    expect(end).toHaveBeenCalledTimes(2)
    expect(confirm).not.toHaveBeenCalled()
  })
})
