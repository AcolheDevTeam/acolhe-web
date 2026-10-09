import { APP_TIMEZONE } from './timezone'

// "Quinta · 9 out", o eyebrow das telas da paciente no protótipo.
export function patientEyebrowDate(date: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: APP_TIMEZONE }).format(date).split('-')[0]!
  const day = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', timeZone: APP_TIMEZONE }).format(date).replace(' de ', ' ').replace('.', '')
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${day}`
}
