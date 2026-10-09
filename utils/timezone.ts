// Fuso de exibição do app. O SSR roda em UTC (Cloudflare) e o browser no fuso
// da pessoa; sem fuso explícito, o servidor e o cliente discordavam do dia e da
// hora, e a hidratação não corrige `style` nem `href` (ACO-83).
export const APP_TIMEZONE = 'America/Sao_Paulo'

const partsFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Dia (`YYYY-MM-DD`), hora e minuto de um instante no fuso do app. */
export function zonedParts(value: Date | string): { day: string, hour: number, minute: number } {
  const parts = Object.fromEntries(partsFormat.formatToParts(new Date(value)).map(part => [part.type, part.value]))
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), minute: Number(parts.minute) }
}

/** Dia de calendário (`YYYY-MM-DD`) de um instante no fuso do app. */
export function zonedDay(value: Date | string = new Date()): string {
  return zonedParts(value).day
}

// Datas de calendário (`YYYY-MM-DD`) são aritmética pura, sem fuso: o meio-dia
// UTC evita qualquer virada de dia.
function calendarDate(day: string): Date {
  return new Date(`${day}T12:00:00Z`)
}

export function addCalendarDays(day: string, amount: number): string {
  const date = calendarDate(day)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

/** Segunda-feira da semana do dia informado. */
export function weekStart(day: string): string {
  return addCalendarDays(day, -((calendarDate(day).getUTCDay() + 6) % 7))
}

const weekdayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'UTC' })

/** Rótulo curto de um dia de calendário, ex.: "seg., 05/10". */
export function calendarDayLabel(day: string): string {
  return weekdayLabel.format(calendarDate(day))
}
