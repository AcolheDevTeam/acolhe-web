import { addCalendarDays, weekStart } from './timezone'

// Peças da grade da agenda (protótipo "Agenda semanal"). Datas de calendário
// (`YYYY-MM-DD`) são formatadas com meio-dia UTC, como em utils/timezone.ts,
// para não depender do fuso de quem renderiza (SSR em UTC).

export type AgendaView = 'dia' | 'semana' | 'mes'

const at = (day: string) => new Date(`${day}T12:00:00Z`)
const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' })
const weekdayShort = fmt({ weekday: 'short' })
const weekdayLong = fmt({ weekday: 'long' })
const dayMonth = fmt({ day: 'numeric', month: 'long' })
const monthYear = fmt({ month: 'long', year: 'numeric' })

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** "seg", "ter"… sem o ponto da abreviação. */
export function weekdayAbbr(day: string): string {
  return weekdayShort.format(at(day)).replace('.', '')
}

/** "Quinta, 9 de outubro". */
export function dayLongLabel(day: string): string {
  return `${capitalize(weekdayLong.format(at(day)).replace('-feira', ''))}, ${dayMonth.format(at(day))}`
}

/** "Outubro de 2026". */
export function monthLabel(day: string): string {
  return capitalize(monthYear.format(at(day)))
}

/** "5 a 10 de outubro"; atravessando o mês, "28 de setembro a 3 de outubro". */
export function rangeLabel(first: string, last: string): string {
  if (first.slice(0, 7) === last.slice(0, 7)) return `${Number(first.slice(8))} a ${dayMonth.format(at(last))}`
  return `${dayMonth.format(at(first))} a ${dayMonth.format(at(last))}`
}

/** Primeiro dia do mês (`YYYY-MM-01`) somado de `offset` meses. */
export function addMonths(day: string, offset: number): string {
  const date = at(`${day.slice(0, 7)}-01`)
  date.setUTCMonth(date.getUTCMonth() + offset)
  return date.toISOString().slice(0, 10)
}

/**
 * Células do mês começando no domingo, como no protótipo: `null` antes do dia 1
 * e depois do último dia, completando semanas inteiras.
 */
export function monthCells(day: string): (string | null)[] {
  const first = `${day.slice(0, 7)}-01`
  const lead = at(first).getUTCDay()
  const cells: (string | null)[] = Array.from({ length: lead }, () => null)
  for (let current = first; current.slice(0, 7) === first.slice(0, 7); current = addCalendarDays(current, 1)) cells.push(current)
  while (cells.length % 7) cells.push(null)
  return cells
}

/** Dias da semana do protótipo: segunda a sábado; domingo só se tiver sessão. */
export function weekDays(day: string, hasSunday: boolean): string[] {
  const monday = weekStart(day)
  return Array.from({ length: hasSunday ? 7 : 6 }, (_, index) => addCalendarDays(monday, index))
}

/** Estilo do evento por status (novo-design.md, "Status de agendamento"). */
export const appointmentToneClass: Record<string, string> = {
  scheduled: 'border-[1.5px] border-primary bg-card text-positive',
  confirmed: 'border border-primary bg-primary text-primary-foreground',
  completed: 'border border-surface-hover bg-surface-hover text-secondary-foreground',
  no_show: 'border-[1.5px] border-alert bg-warning-soft text-warning',
  canceled: 'border border-dashed border-input-hover bg-card text-muted-foreground line-through',
}

export function appointmentTone(status: string): string {
  return appointmentToneClass[status] ?? appointmentToneClass.scheduled!
}
