import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useOpenAppointmentRecord } from '../composables/useOpenAppointmentRecord'
import type { Appointment } from '../types'
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))
afterEach(() => vi.unstubAllGlobals())
describe('abertura de evolução', () => {
  it('bloqueia aberturas simultâneas até terminar a navegação e libera depois', async () => {
    let resolve!: (value: unknown) => void
    const fetch = vi.fn(() => new Promise(done => { resolve = done }))
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('$fetch', fetch)
    vi.stubGlobal('refreshNuxtData', vi.fn().mockResolvedValue(undefined))
    const navigate = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigateTo', navigate)
    const { opening, openRecord } = useOpenAppointmentRecord()
    const appointment = { id: 'appointment' } as Appointment
    const first = openRecord(appointment)
    expect(opening.value).toBe('appointment')
    await openRecord(appointment)
    expect(fetch).toHaveBeenCalledTimes(1)
    resolve({ id: 'session', patientId: 'patient' })
    await first
    expect(navigate).toHaveBeenCalledWith('/sessions/session')
    expect(opening.value).toBeNull()
  })
  it('abre uma sessão existente sem criar outra', async () => {
    vi.stubGlobal('ref', ref)
    const fetch = vi.fn()
    const navigate = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('$fetch', fetch)
    vi.stubGlobal('navigateTo', navigate)
    await useOpenAppointmentRecord().openRecord({ id: 'appointment', sessionId: 'session' } as Appointment)
    expect(fetch).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/sessions/session')
  })
})
