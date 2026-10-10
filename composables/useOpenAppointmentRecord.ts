import { toast } from 'vue-sonner'
import type { Appointment, Session } from '~/types'

export function useOpenAppointmentRecord() {
  const opening = ref<string | null>(null)
  async function openRecord(appointment: Appointment) {
    if (opening.value) return
    if (appointment.sessionId) return navigateTo(`/sessions/${appointment.sessionId}`)
    opening.value = appointment.id
    try {
      const session = await $fetch<Session>(`/api/appointments/${appointment.id}/session`, { method: 'POST' })
      await refreshNuxtData([`sessions-${session.patientId}`, 'sessions-all', 'appointments-all', `appointment-${appointment.id}`])
      await navigateTo(`/sessions/${session.id}`)
    } catch (error) {
      toast.error(apiErrorMessage(error, {
        403: 'O vínculo com este(a) paciente precisa estar ativo para registrar a evolução.',
        404: 'Este agendamento não está disponível para você.',
        409: 'A evolução pode ser registrada a partir do horário de um atendimento não cancelado.',
        default: 'Não foi possível abrir o prontuário agora.',
      }))
    } finally { opening.value = null }
  }
  return { opening, openRecord }
}
