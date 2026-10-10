// O dia do check-in é o mesmo no portal e no banco, inclusive perto da meia-noite.
export const CHECKIN_TIMEZONE = 'America/Fortaleza'
export function checkinDay(value: Date | string = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: CHECKIN_TIMEZONE }).format(new Date(value))
}
export function checkinDateLabel(day: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: CHECKIN_TIMEZONE }).format(new Date(`${day}T12:00:00-03:00`))
}

// Os cinco níveis de humor do protótipo (1 a 5), do mais difícil ao melhor.
export const MOOD_LABELS = ['Difícil', 'Pesado', 'Neutro', 'Leve', 'Bem'] as const
export function moodLabel(mood: number): string {
  return MOOD_LABELS[mood - 1] ?? String(mood)
}

export interface CheckinDayCell {
  day: string
  weekday: string
  mood: number | null
}

// Últimos `count` dias (o último é hoje), com o humor de cada um ou null quando
// não houve check-in. Dias no fuso do check-in, como na API.
export function recentCheckinDays(checkins: { day: string, mood: number }[], count = 14, now: Date = new Date()): CheckinDayCell[] {
  const byDay = new Map(checkins.map(item => [item.day, item.mood]))
  const today = new Date(`${checkinDay(now)}T12:00:00-03:00`)
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: CHECKIN_TIMEZONE })
  const cells: CheckinDayCell[] = []
  for (let offset = count - 1; offset >= 0; offset--) {
    const date = new Date(today.getTime() - offset * 86_400_000)
    const day = checkinDay(date)
    cells.push({ day, weekday: weekday.format(date).replace('.', ''), mood: byDay.get(day) ?? null })
  }
  return cells
}

// Média dos dias com registro, "3,5 de 5"; null quando não há nenhum.
export function moodAverageLabel(cells: CheckinDayCell[]): string | null {
  const moods = cells.map(cell => cell.mood).filter((mood): mood is number => mood !== null)
  if (!moods.length) return null
  const average = moods.reduce((sum, mood) => sum + mood, 0) / moods.length
  return `${average.toFixed(1).replace('.', ',')} de 5`
}
