import { apiErrorInfo } from './api-error'

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

// ACO-103: sentimentos do check-in. Lista fechada, a mesma da API
// (internal/checkin/fields.go); o valor é o código gravado.
export const CHECKIN_FEELINGS = [
  { value: 'ansiedade', label: 'Ansiedade' },
  { value: 'cansaco', label: 'Cansaço' },
  { value: 'calma', label: 'Calma' },
  { value: 'foco', label: 'Foco' },
  { value: 'tristeza', label: 'Tristeza' },
  { value: 'irritacao', label: 'Irritação' },
  { value: 'esperanca', label: 'Esperança' },
  { value: 'saudade', label: 'Saudade' },
] as const
export type CheckinFeeling = typeof CHECKIN_FEELINGS[number]['value']
export const CHECKIN_FEELING_VALUES = CHECKIN_FEELINGS.map(f => f.value) as [CheckinFeeling, ...CheckinFeeling[]]

// Ao editar, só os códigos que este front conhece voltam para os chips: uma
// opção nova na API não pode travar a validação do check-in.
export function knownFeelings(codes: readonly string[] | null | undefined): CheckinFeeling[] {
  return (codes ?? []).filter((code): code is CheckinFeeling => (CHECKIN_FEELING_VALUES as readonly string[]).includes(code))
}

// Código desconhecido (opção nova na API) aparece como veio.
export function feelingLabel(code: string): string {
  return CHECKIN_FEELINGS.find(f => f.value === code)?.label ?? code
}

// Horários de sono: "HH:MM" na API, minutos desde a meia-noite no passo a
// passo e "23h30" na tela, como no protótipo.
export const SLEEP_STEP_MINUTES = 15
const DAY_MINUTES = 24 * 60

export function clockToMinutes(clock: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(clock)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

export function minutesToClock(minutes: number): string {
  const value = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

export function clockLabel(clock: string): string {
  return clock.replace(':', 'h')
}

// Duração do sono considerando a virada da meia-noite (23:30 → 06:45 = 7h15).
export function sleepDurationMinutes(bedtime: string, wake: string): number | null {
  const bed = clockToMinutes(bedtime)
  const up = clockToMinutes(wake)
  if (bed == null || up == null || bed === up) return null
  return ((up - bed) % DAY_MINUTES + DAY_MINUTES) % DAY_MINUTES
}

// "7h15", "8h"; para leitores de tela, "7 horas e 15 minutos".
export function durationLabel(minutes: number): string {
  const rounded = Math.round(minutes)
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

export function durationSpoken(minutes: number): string {
  const rounded = Math.round(minutes)
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  const hours = `${h} ${h === 1 ? 'hora' : 'horas'}`
  return m ? `${hours} e ${m} minutos` : hours
}

interface CheckinSleepFields {
  day: string
  mood: number
  sleepBedtime?: string | null
  sleepWakeTime?: string | null
  sleepMinutes?: number | null
  sleepQuality?: number | null
  feelings?: string[] | null
}

export function checkinSleepMinutes(item: CheckinSleepFields): number | null {
  if (item.sleepMinutes != null) return item.sleepMinutes
  return item.sleepBedtime && item.sleepWakeTime ? sleepDurationMinutes(item.sleepBedtime, item.sleepWakeTime) : null
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null
}

// Médias dos últimos `days` dias (o último é hoje), só do que foi registrado.
// Cada média diz de quantos registros saiu; sem registro, fica null.
export function checkinAverages(checkins: CheckinSleepFields[], days = 14, now: Date = new Date()) {
  const cells = recentCheckinDays([], days, now)
  const from = cells[0]!.day
  const to = cells[cells.length - 1]!.day
  const recent = checkins.filter(c => c.day >= from && c.day <= to)
  const sleep = recent.map(checkinSleepMinutes).filter((v): v is number => v != null)
  const quality = recent.map(c => c.sleepQuality).filter((v): v is number => v != null)
  return {
    count: recent.length,
    mood: average(recent.map(c => c.mood)),
    sleepMinutes: average(sleep),
    sleepCount: sleep.length,
    sleepQuality: average(quality),
    qualityCount: quality.length,
  }
}

export function scoreLabel(value: number): string {
  return `${value.toFixed(1).replace('.', ',')} de 5`
}

// Quantas vezes cada sentimento foi marcado, do mais frequente ao menos.
export function feelingCounts(checkins: CheckinSleepFields[]): { value: string, label: string, count: number }[] {
  const counts = new Map<string, number>()
  for (const item of checkins) {
    for (const code of item.feelings ?? []) counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: feelingLabel(value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
}

// Resumo do check-in salvo, como no protótipo: "Humor leve, 7h15 de sono,
// ansiedade, calma." Só entra o que foi registrado.
export function checkinSummary(item: CheckinSleepFields): string {
  const parts = [`Humor ${moodLabel(item.mood).toLowerCase()}`]
  const sleep = checkinSleepMinutes(item)
  if (sleep != null) parts.push(`${durationLabel(sleep)} de sono`)
  if (item.sleepQuality != null) parts.push(`qualidade do sono ${item.sleepQuality} de 5`)
  for (const code of item.feelings ?? []) parts.push(feelingLabel(code).toLowerCase())
  return `${parts.join(', ')}.`
}

// 400 do check-in: a API diz qual campo recusou; a tela responde com uma frase
// própria para cada caso (regra A6), nunca com o texto técnico.
export function checkinRejectionMessage(error: unknown): string {
  const technical = (apiErrorInfo(error).technical ?? '').toLowerCase()
  if (technical.includes('diferente')) return 'O horário em que acordou precisa ser diferente do horário em que dormiu.'
  if (technical.includes('dormiu') && technical.includes('acordou')) return 'Informe os dois horários de sono, ou limpe o sono.'
  if (technical.includes('dormiu')) return 'O horário em que você dormiu não foi aceito. Ajuste em passos de 15 minutos.'
  if (technical.includes('acordou')) return 'O horário em que você acordou não foi aceito. Ajuste em passos de 15 minutos.'
  if (technical.includes('qualidade')) return 'Escolha a qualidade do sono de 1 a 5.'
  if (technical.includes('sentimento')) return 'Um dos sentimentos não está na lista. Atualize a página e escolha de novo.'
  if (technical.includes('observação')) return 'A observação deve ter no máximo 1.000 caracteres.'
  return 'Escolha o humor de 1 a 5 e revise o sono e os sentimentos.'
}
