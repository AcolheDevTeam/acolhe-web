// O dia do check-in é o mesmo no portal e no banco, inclusive perto da meia-noite.
export const CHECKIN_TIMEZONE = 'America/Fortaleza'
export function checkinDay(value: Date | string = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: CHECKIN_TIMEZONE }).format(new Date(value))
}
export function checkinDateLabel(day: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: CHECKIN_TIMEZONE }).format(new Date(`${day}T12:00:00-03:00`))
}
