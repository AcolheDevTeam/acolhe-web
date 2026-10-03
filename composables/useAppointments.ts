import type { Appointment } from '~/types'

export function useAppointments() {
  return useFetch<Appointment[]>('/api/appointments', { key: 'appointments-all', default: () => [] })
}

export function useAppointment(appointmentId: MaybeRefOrGetter<string>) {
  const id = toRef(appointmentId)
  return useFetch<Appointment>(() => `/api/appointments/${id.value}`, { key: () => `appointment-${id.value}` })
}
