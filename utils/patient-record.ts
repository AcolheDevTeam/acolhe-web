import type { Appointment, Session } from '~/types'

// Agendamentos não comprovam realização: oferecemos somente a abertura da evolução.
export function pendingRecordAppointments(appointments: Appointment[], sessions: Session[], patientId: string, now: number) {
  const sessionIds = new Set(sessions.map(session => session.id))
  const appointmentIds = new Set(sessions.map(session => session.appointmentId).filter(Boolean))
  return appointments.filter(appointment =>
    appointment.patientId === patientId
    && ['scheduled', 'confirmed', 'completed'].includes(appointment.status)
    && new Date(appointment.scheduledFor).getTime() <= now
    && !appointmentIds.has(appointment.id)
    && (!appointment.sessionId || !sessionIds.has(appointment.sessionId)),
  ).sort((a, b) => Date.parse(b.scheduledFor) - Date.parse(a.scheduledFor))
}
