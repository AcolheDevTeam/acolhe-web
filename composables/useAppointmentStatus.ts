import { useNow } from '@vueuse/core'
import { toast } from 'vue-sonner'
import type { Appointment } from '~/types'
import { appointmentConflictMessage, finalStatusConfirmation, type FinalAppointmentStatus } from '~/utils/appointment-errors'

// Ações de status de um agendamento (detalhe e painel da agenda). As sem volta
// passam por confirmação (ACO-83; regra A2, sem confirm() nativo).
export function useAppointmentStatus(appointment: Ref<Appointment | null | undefined>) {
  const changingStatus = ref(false)
  const { opening, openRecord: openAppointmentRecord } = useOpenAppointmentRecord()
  const busy = computed(() => changingStatus.value || opening.value !== null)
  const now = useNow({ interval: 60000 })
  const active = computed(() => ['scheduled', 'confirmed'].includes(appointment.value?.status ?? ''))
  const hasStarted = computed(() => !!appointment.value && new Date(appointment.value.scheduledFor) <= now.value)
  const canOpenRecord = computed(() => !!appointment.value && (!!appointment.value.sessionId || (hasStarted.value && (active.value || appointment.value.status === 'completed'))))

  const pendingStatus = ref<FinalAppointmentStatus | null>(null)
  const confirmation = computed(() => pendingStatus.value ? finalStatusConfirmation[pendingStatus.value] : null)
  function askStatus(status: FinalAppointmentStatus) {
    if (!busy.value) pendingStatus.value = status
  }
  async function decideStatus(confirmed: boolean) {
    const status = pendingStatus.value
    pendingStatus.value = null
    if (confirmed && status) await changeStatus(status)
  }

  async function changeStatus(status: string) {
    const id = appointment.value?.id
    if (busy.value || !id) return
    changingStatus.value = true
    try {
      await $fetch(`/api/appointments/${id}/status`, { method: 'PUT', body: { status } })
      await refreshNuxtData([`appointment-${id}`, 'appointments-all'])
      toast.success('Agendamento atualizado.')
    } catch (error) {
      toast.error(appointmentConflictMessage(error) ?? apiErrorMessage(error, { 404: 'Este agendamento não está disponível para você.', 409: 'O status mudou ou esta ação não é permitida. Recarregue o agendamento.', default: 'Não foi possível atualizar o agendamento.' }))
    } finally { changingStatus.value = false }
  }
  async function openRecord() {
    if (!busy.value && appointment.value) await openAppointmentRecord(appointment.value)
  }

  return { busy, active, hasStarted, canOpenRecord, pendingStatus, confirmation, askStatus, decideStatus, changeStatus, openRecord }
}
